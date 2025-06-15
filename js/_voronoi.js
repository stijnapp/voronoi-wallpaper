class VoronoiDiagram {
    // https://www.youtube.com/watch?v=I6Fen2Ac-1U

    constructor() {
        this.eps = Math.pow(2, -23);
    }

    compute(sites, padding = 10) {
        var leftBound = -padding;
        var bottomBound = screen.height + padding;
        var rightBound = screen.width + padding;
        var topBound = -padding;

        var processedSites = this.preprocess_sites(sites);

        var voronoiBox = [
            [leftBound, topBound], [rightBound, topBound],
            [rightBound, bottomBound], [leftBound, bottomBound]
        ];

        var cells = [];

        for (var siteIndex = 0; siteIndex < processedSites.length; siteIndex++) {
            var cell = voronoiBox;
            var currentSite = processedSites[siteIndex];

            for (var otherSiteIndex = 0; otherSiteIndex < processedSites.length; otherSiteIndex++) {
                if (siteIndex == otherSiteIndex) continue;

                var cellVertexCount = cell.length;
                var clippedCell = [];
                var otherSite = processedSites[otherSiteIndex];
                var bisector = this.two_points_bisector(currentSite, otherSite);

                if (bisector[0] == 0 && bisector[1] == 0) continue;

                for (var vertexIndex = 0; vertexIndex < cellVertexCount; vertexIndex++) {
                    var currentVertex = cell[vertexIndex];
                    var nextVertex = cell[(vertexIndex + 1) % cellVertexCount];
                    var firstIntersection = this.line_and_segment_intersection(bisector, currentVertex, nextVertex);

                    if (firstIntersection) {
                        var intersectionIsNextVertex = (firstIntersection[0] == nextVertex[0]) && (firstIntersection[1] == nextVertex[1]);

                        if (intersectionIsNextVertex) {
                            clippedCell.push(nextVertex, cell[(vertexIndex + 2) % cellVertexCount]);
                            var firstIntersectionIndex = (vertexIndex + 2) % cellVertexCount;
                        } else {
                            clippedCell.push(firstIntersection, nextVertex);
                            var firstIntersectionIndex = (vertexIndex + 1) % cellVertexCount;
                        }
                        break;
                    }
                }

                if (clippedCell.length == 0) {
                    clippedCell = cell;
                } else {
                    for (var vertexIndex = firstIntersectionIndex; vertexIndex < cellVertexCount; vertexIndex++) {
                        var currentVertex = cell[vertexIndex];
                        var nextVertex = cell[(vertexIndex + 1) % cellVertexCount];
                        var secondIntersection = this.line_and_segment_intersection(bisector, currentVertex, nextVertex);

                        if (secondIntersection) {
                            clippedCell.push(secondIntersection);
                            var secondIntersectionIndex = vertexIndex + 1;
                            break;
                        } else {
                            clippedCell.push(nextVertex);
                        }
                    }

                    if (!this.is_point_in_polygon(currentSite, clippedCell)) {
                        clippedCell = this.two_points_equal(secondIntersection, cell[secondIntersectionIndex % cellVertexCount]) ? [] : [secondIntersection];

                        for (var vertexIndex = secondIntersectionIndex; vertexIndex % cellVertexCount > firstIntersectionIndex || vertexIndex % cellVertexCount < firstIntersectionIndex; vertexIndex++) {
                            var vertex1 = cell[vertexIndex % cellVertexCount];
                            var vertex2 = cell[(vertexIndex + 1) % cellVertexCount];

                            if (this.two_points_equal(vertex1, vertex2)) continue;
                            clippedCell.push(vertex1);
                        }

                        if (!this.two_points_equal(firstIntersection, vertex1)) clippedCell.push(firstIntersection);
                    }
                }

                cell = clippedCell;
            }

            if (cell.length > 0) {
                cells.push(cell);
            } else {
                cells.push(null);
            }
        }

        return { sites: processedSites, cells: cells };
    }

    preprocess_sites(sites) {
        var uniqueSites = [...new Map(sites.map(site => [JSON.stringify(site), site])).values()];

        var magnitude = this.max_xy(uniqueSites),
            offsetX = this.eps * magnitude[0] * 100,
            offsetY = this.eps * magnitude[1] * 100;

        for (var siteIndex = 0; siteIndex < uniqueSites.length; siteIndex++) {
            uniqueSites[siteIndex][0] = uniqueSites[siteIndex][0] + random(0, offsetX);
            uniqueSites[siteIndex][1] = uniqueSites[siteIndex][1] + random(0, offsetY);
        }

        return uniqueSites;
    }

    max_xy(points) {
        var maxX = Math.abs(points[0][0]), maxY = Math.abs(points[0][1]);

        for (var pointIndex = 1; pointIndex < points.length; pointIndex++) {
            var absX = Math.abs(points[pointIndex][0]), absY = Math.abs(points[pointIndex][1]);

            if (absX > maxX) maxX = absX;
            if (absY > maxY) maxY = absY;
        }

        maxX = maxX > 1 ? maxX : 1;
        maxY = maxY > 1 ? maxY : 1;

        return [maxX, maxY];
    }

    two_points_equal(pointA, pointB) {
        return (pointA[0] == pointB[0]) && (pointA[1] == pointB[1]);
    }

    two_points_bisector(pointA, pointB) {
        var midpoint = [(pointA[0] + pointB[0]) / 2, (pointA[1] + pointB[1]) / 2];

        var lineA = pointB[0] - pointA[0];
        var lineB = pointB[1] - pointA[1];
        var lineC = -midpoint[0] * lineA - midpoint[1] * lineB;

        return [lineA, lineB, lineC];
    }

    line_and_segment_intersection(line, pointA, pointB) {
        var segmentA = pointA[1] - pointB[1];
        var segmentB = pointB[0] - pointA[0];
        var segmentC = pointA[0] * pointB[1] - pointB[0] * pointA[1];

        var segmentLine = [segmentA, segmentB, segmentC];

        if ((line[0] / line[1] == segmentLine[0] / segmentLine[1]) && (line[2] / line[1] == segmentLine[2] / segmentLine[1])) {
            return null;
        }

        var crossProduct = this.cross_prod(line, segmentLine);

        if ((crossProduct[2] == 0)) {
            return null;
        } else {
            var intersection = [crossProduct[0] / crossProduct[2], crossProduct[1] / crossProduct[2]];

            var isVertical = this.isclose(pointA[0], pointB[0]);
            var isHorizontal = this.isclose(pointA[1], pointB[1]);
            var isEndpointY = this.isclose(intersection[1], pointA[1]) || this.isclose(intersection[1], pointB[1]);
            var isEndpointX = this.isclose(intersection[0], pointA[0]) || this.isclose(intersection[0], pointB[0]);
            var isBetweenXAxis = (intersection[0] < pointA[0]) != (intersection[0] < pointB[0]);
            var isBetweenYAxis = (intersection[1] < pointA[1]) != (intersection[1] < pointB[1]);
            var isBetweenSegment = isBetweenXAxis && isBetweenYAxis;

            if (isVertical && (isEndpointY || isBetweenYAxis)) return intersection;
            else if (isHorizontal && (isEndpointX || isBetweenXAxis)) return intersection;
            else if (isBetweenSegment) return intersection;
            else return null;
        }
    }

    cross_prod(vectorA, vectorB) {
        var ax = vectorA[0], ay = vectorA[1], az = vectorA[2];
        var bx = vectorB[0], by = vectorB[1], bz = vectorB[2];

        var crossX = ay * bz - az * by;
        var crossY = az * bx - ax * bz;
        var crossZ = ax * by - ay * bx;

        return [crossX, crossY, crossZ];
    }

    isclose(valueA, valueB, tolerance = this.eps) {
        return Math.abs(valueA - valueB) < tolerance;
    }


    is_point_in_polygon(point, polygon) {
        var polygonVertexCount = polygon.length;

        for (var vertexIndex = 0; vertexIndex < polygonVertexCount; vertexIndex++) {
            var edgeVector = [polygon[vertexIndex][0] - polygon[(vertexIndex + 1) % polygonVertexCount][0], polygon[vertexIndex][1] - polygon[(vertexIndex + 1) % polygonVertexCount][1]];
            var pointVector = [point[0] - polygon[(vertexIndex + 1) % polygonVertexCount][0], point[1] - polygon[(vertexIndex + 1) % polygonVertexCount][1]];
            var nextEdgeVector = [polygon[(vertexIndex + 2) % polygonVertexCount][0] - polygon[(vertexIndex + 1) % polygonVertexCount][0], polygon[(vertexIndex + 2) % polygonVertexCount][1] - polygon[(vertexIndex + 1) % polygonVertexCount][1]];

            if (!(this.cross_2D(edgeVector, pointVector) * this.cross_2D(edgeVector, nextEdgeVector) >= 0 && this.cross_2D(nextEdgeVector, pointVector) * this.cross_2D(nextEdgeVector, edgeVector) >= 0)) {
                return false;
            }
        }

        return true;
    }

    cross_2D(vectorU, vectorV) {
        return vectorU[0] * vectorV[1] - vectorU[1] * vectorV[0];
    }

	calculateRoundedPolygon(vertices, radius) {
		if (vertices.length < 3) return null;

		// Calculate rounded corner points
		let roundedPoints = [];

		for (let i = 0; i < vertices.length; i++) {
			let prev = vertices[(i - 1 + vertices.length) % vertices.length];
			let curr = vertices[i];
			let next = vertices[(i + 1) % vertices.length];

			// Vectors from current point to previous and next
			let toPrev = [prev[0] - curr[0], prev[1] - curr[1]];
			let toNext = [next[0] - curr[0], next[1] - curr[1]];

			// Normalize vectors
			let toPrevLen = Math.sqrt(toPrev[0] * toPrev[0] + toPrev[1] * toPrev[1]);
			let toNextLen = Math.sqrt(toNext[0] * toNext[0] + toNext[1] * toNext[1]);

			if (toPrevLen > 0) {
				toPrev[0] /= toPrevLen;
				toPrev[1] /= toPrevLen;
			}

			if (toNextLen > 0) {
				toNext[0] /= toNextLen;
				toNext[1] /= toNextLen;
			}

			// Calculate the actual radius to use (limited by edge lengths)
			let actualRadius = Math.min(radius, toPrevLen / 2, toNextLen / 2);

			// Points where the curve starts and ends
			let startPoint = [curr[0] + toPrev[0] * actualRadius, curr[1] + toPrev[1] * actualRadius];
			let endPoint = [curr[0] + toNext[0] * actualRadius, curr[1] + toNext[1] * actualRadius];

			roundedPoints.push({
				start: startPoint,
				corner: curr,
				end: endPoint,
				radius: actualRadius
			});
		}

		return roundedPoints;
	}
}