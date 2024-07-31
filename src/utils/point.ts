import { Vector2d } from "konva/lib/types";
import simplify from "simplify-js";
import fitCurve from "fit-curve";

export const singleVector2dToLinePoint = (v: Vector2d) => {
  return [v.x, v.y]
}

export const linePointsToVector2d = (arr: number[]) => {

  let vector2dArray: Vector2d[] = []

  for (let i = 0; i < arr.length; i++) {
    if (i % 2 == 1) { // e.g. 1 -> [0, 1], 3 -> [2, 3]
      const x = arr[i - 1]
      const y = arr[i]

      vector2dArray.push({x, y})    
    }
  }

  return vector2dArray
}

export const fitBezierCurve = (arr: number[]) => {
  let tupleArray: [number, number][] = []

  for (let i = 0; i < arr.length; i++) {
    if (i % 2 == 1) { // e.g. 1 -> [0, 1], 3 -> [2, 3]
      const x = arr[i - 1]
      const y = arr[i]

      tupleArray.push([x, y])    
    }
  }

  const bezierCurves = fitCurve(tupleArray, 20)

  const bezierPoints = bezierCurves.map((curve) => {
    const point = curve[0]
    const vector: Vector2d = {x: point[0], y: point[1]}
    return vector
  })

  return bezierPoints
}

export const simplifyPoints = (arr: number[]) => {
  const vectorArray = linePointsToVector2d(arr)

  const simplifiedVectorArray = simplify(vectorArray, 3, true)

  let simplifiedLinePointsArray: number[] = []
  simplifiedVectorArray.forEach( vector => {
    simplifiedLinePointsArray.push(vector.x)
    simplifiedLinePointsArray.push(vector.y)
  });

  return simplifiedLinePointsArray
}