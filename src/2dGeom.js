/*
 mini 2d geometry helpers functions
 https://martin-thoma.com/how-to-check-if-two-line-segments-intersect/
 https://algs4.cs.princeton.edu/91primitives/
 i did have a look also on this one but i did not use it : https://www.npmjs.com/package/2d-polygon-self-intersections
 */

/**
 * very simplistic Point class
 */
class Point {
  constructor (x, y, name = '') {
    this.x = x
    this.y = y
    this.name = name // for debug purpose
  }
}
class Segment {
  constructor (p1, p2, name = '') {
    this.p1 = p1
    this.p2 = p2
    this.name = name // for debug purpose
  }
}

/* 6.1 geometric primitives : https://algs4.cs.princeton.edu/91primitives/
 And  Book : Algorithms in C++ by Robert Sedgewick Addison-Wesley ISBN 0-201-51059-6

 */
function isCcw (p1, p2, p3) {
  return (p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y)
}
// l1 and l2 are segments
function intersects (l1, l2) {
  if (isCcw(l1.p1, l1.p2, l2.p1) * isCcw(l1.p1, l1.p2, l2.p2) > 0) return false
  if (isCcw(l2.p1, l2.p2, l1.p1) * isCcw(l2.p1, l2.p2, l1.p2) > 0) return false
  return true
}

/**
 * polygonSelfIntersect allows to know if a polygon as self-intersection
 * @param arr2DPolygonCoords array of x,y coordinates values from the vertices of external ring of a closed Polygon (last two x,y values should be equal to first)
 * @return {boolean} true if there is a self-intersection in the polygon.  false elsewhere
 */
export function polygonSelfIntersect (arr2DPolygonCoords) {
  let PointSegments = []
  let Segments = []
  let offset = 0
  for (let i = 0; i < ((arr2DPolygonCoords.length / 2)); i++) {
    offset = i * 2
    PointSegments.push(new Point(arr2DPolygonCoords[offset], arr2DPolygonCoords[offset + 1], `P${i + 1}`))
  }
  // last point is supposed to be equal to first point of polygon (closed polygon)
  PointSegments[PointSegments.length - 1].name = PointSegments[0].name
  for (let i = 0; i < (PointSegments.length - 1); i++) {
    Segments.push(new Segment(PointSegments[i], PointSegments[i + 1], `S${i + 1}`))
  }
  for (let i = 0; i < Segments.length; i++) {
    for (let j = i + 2; j < Segments.length; j++) { // no need to test adjacent segments
      // console.log(i,j,Segments[i],Segments[j])
      if (!((i === 0) && (j === (Segments.length - 1)))) { // no need to test connection from first segment with last one
        if (intersects(Segments[i], Segments[j])) {
          console.log(`%c WARNING Segment ${Segments[i].name} intersects with ${Segments[j].name}`, 'background: #222; color: #bada55')
          return true
        } else {
          console.log(`%c OK Segment ${Segments[i].name} does not intersects with ${Segments[j].name}`, 'background: #00ff33; color: #111')
        }
      }
    }
  }
  return false
}
