import "./App.css";

import React, { useEffect, useState, useRef, LegacyRef } from "react";
import { createRoot } from "react-dom/client";
import { Stage, Layer, Rect, Text, Circle, Line, Arrow } from "react-konva";

import { KonvaEventObject } from "konva/lib/Node";

import Konva from "konva";
import { NodeConfig } from "konva/lib/Node";

import { SYS_PROMT } from "./prompt";

import OpenAI from "openai";
import {
  fitBezierCurve,
  linePointsToVector2d,
  simplifyPoints,
} from "./utils/point";
import { Vector2d } from "konva/lib/types";

interface LineInfo {
  points: number[];
}

const SAMPLE_PROMPT = `I want the ball flies to the center.
`;
// const SAMPLE_PROMPT = `I want the ball flies to the center. And I want it to scale up and change its color to red when it reaches 3/4 point of the whole path
// `;

const smapleData = [
  {
    "dur": 0.2,
    "st": 0,
    "x": 209
  },
  {
    "dur": 0.2,
    "st": 0,
    "y": 103
  },
  {
    "dur": 0.4,
    "st": 0.2,
    "x": 441
  },
  {
    "dur": 0.4,
    "st": 0.2,
    "y": 292
  },
  {
    "dur": 0.1,
    "st": 0.6,
    "x": 492
  },
  {
    "dur": 0.4,
    "st": 0.7,
    "x": 626
  },
  {
    "dur": 0.4,
    "st": 0.7,
    "y": 199
  },
  {
    "dur": 0.2,
    "st": 1.1,
    "x": 714
  },
  {
    "dur": 0.2,
    "st": 1.1,
    "y": 173
  },
  {
    "dur": 0.4,
    "st": 1.3,
    "x": 891
  },
  {
    "dur": 0.4,
    "st": 1.3,
    "y": 264
  }
]

const App = () => {
  // const [tool, setTool] = useState("pen");
  const [lines, setLines] = useState<LineInfo[]>([]);
  const [bezierPoints, setBezierPoints] = useState<Vector2d[]>([]);
  const isDrawing = useRef(false);

  const [jsonStr, setJsonStr] = useState("Idle");
  const [prompt, setPrompt] = useState(SAMPLE_PROMPT);

  const stageRef = useRef<Konva.Stage>(null);
  const circleRef = useRef<Konva.Circle>(null);
  const clientRef = useRef(
    new OpenAI({
      apiKey: process.env["REACT_APP_OPENAI_API_KEY"],
      dangerouslyAllowBrowser: true,
    })
  );

  function downloadURI(uri, name) {
    var link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    // no drawing - skipping
    if (!isDrawing.current) {
      return;
    }
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];
    // add point
    lastLine.points = lastLine.points.concat([point.x, point.y]);

    // replace last
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    let lastLine = lines[lines.length - 1];

    const simplified = simplifyPoints(lastLine.points);
    console.log(simplified);
    lines.splice(lines.length - 1, 1, { points: simplified });
    setLines(lines.concat());

    const _bezierPoints = fitBezierCurve(simplified);
    
    setBezierPoints(_bezierPoints);
  };

  const handleResetDrawing = () => {
    setLines([]);
    setBezierPoints([])
  };

  const handleResetObject = () => {
    if (!circleRef.current) return;
    const circle = circleRef.current;

    circle.setAttrs({
      x: 200,
      y: 100,
      scaleX: 1,
      scaleY: 1,
      fill: "green",
      rotation: 0,
      opacity: 1,
      strokeWidth: 1,
    });
  };

  const handleAnimate = async () => {
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL();
    // console.log(uri);
    // downloadURI(uri, "test.png")

    if (!clientRef.current) return;

    const client = clientRef.current;

    const lastLinePoints = lines[lines.length - 1].points;
    
    

    let vectorString = ""

    bezierPoints.forEach((point) => {
      vectorString += `{x:${point.x}, y: ${point.y}} `
    })

    const lastPointX = lastLinePoints[lastLinePoints.length - 2]
    const lastPointY = lastLinePoints[lastLinePoints.length - 1]
    vectorString += `{x: ${lastPointX}, y: ${lastPointY}}`
    console.log(vectorString)

    // const completion = await client.chat.completions.create({
    //   messages: [
    //     { role: "system", content: SYS_PROMT },
    //     // { role: "user", content: `[Guide Path](destination must be {x:${lastPoint.x}, y: ${lastPoint.y}})\n
    //     // ${vectorizedLastLine}`},
    //     { role: "user", content: `[Guide Path](You must visit following points)\n
    //     ${vectorString}`},
    //     {
    //       role: "user",
    //       content: [
    //         { type: "text", text: "[Guide Image]" },
    //         {
    //           type: "image_url",
    //           image_url: {
    //             url: uri,
    //           },
    //         },
    //       ],
    //     },
    //     {
    //       role: "user",
    //       content: `
    //         [Command]\n${prompt}`,
    //     },
    //   ],
    //   model: "gpt-4o",
    // });
    // const jsonString = completion.choices[0].message.content;
    // console.log(jsonString);

    // if (!jsonString) {
    //   console.log("json error");
    //   return;
    // }

    // const safeJsonString = jsonString.replace(/,(?=\s*[\]}])/g, "");

    // setJsonStr(safeJsonString);

    // const jsonRes: Object[] = JSON.parse(safeJsonString);
    // console.log(jsonRes);

    const jsonRes = smapleData

    playTweens(jsonRes)


  };

  const handlePromptTextAreaChange = (e) => {
    const newPrompt = e.target.value;
    setPrompt(newPrompt);
  };

  const handleReplay = () => {
    const jsonRes: Object[] = JSON.parse(jsonStr);

    playTweens(jsonRes);
  };

  const playTweens = (jsonRes: Object[]) => {
    const circle = circleRef.current;

    jsonRes.forEach((tweenJson) => {
      // const duration = tweenJson["duration"];
      // const start = tweenJson["start"];
      const duration = tweenJson["dur"];
      const start = tweenJson["st"] * 1000;
      let valueField = "x";
      let value = tweenJson["x"];

      if (tweenJson.hasOwnProperty("y")) {
        valueField = "y";
        value = tweenJson["y"];
      } else if (
        tweenJson.hasOwnProperty("scaleX") ||
        tweenJson.hasOwnProperty("scX")
      ) {
        valueField = "scaleX";
        value = tweenJson["scX"];
      } else if (
        tweenJson.hasOwnProperty("scaleY") ||
        tweenJson.hasOwnProperty("scY")
      ) {
        valueField = "scaleY";
        value = tweenJson["scY"];
      } else if (
        tweenJson.hasOwnProperty("skewX") ||
        tweenJson.hasOwnProperty("skX")
      ) {
        valueField = "skewX";
        value = tweenJson["skX"];
      } else if (
        tweenJson.hasOwnProperty("skewY") ||
        tweenJson.hasOwnProperty("skY")
      ) {
        valueField = "skewY";
        value = tweenJson["skY"];
      } else if (
        tweenJson.hasOwnProperty("opacity") ||
        tweenJson.hasOwnProperty("op")
      ) {
        valueField = "opacity";
        value = tweenJson["op"];
      } else if (
        tweenJson.hasOwnProperty("fill") ||
        tweenJson.hasOwnProperty("f")
      ) {
        valueField = "fill";
        value = tweenJson["f"];
      }

      setTimeout(() => {
        const tween = new Konva.Tween({
          node: circle,
          duration: duration,
          [valueField]: value,
          easing: valueField == "x" ? Konva.Easings.EaseIn : Konva.Easings.EaseOut,

        });
        // const tween = new Konva.Tween({
        //   node: circle,
        //   duration: duration,
        //   [valueField]: value,
        //   easing: Konva.Easings.Linear,
        //   onUpdate: (e) => console.log(e)
        // });
        // console.log(tween);
        // console.log(tweenJson);
        // console.log(`${start} ${duration} ${valueField} ${value}`);
        tween.play();
      }, start);
    });
  };

  return (
    <div className="app-container">
      <Stage
        width={window.innerWidth}
        height={window.innerHeight * 0.5}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        ref={stageRef}
      >
        <Layer>
          <Text text="Some text on canvas" fontSize={15} />
          <Circle ref={circleRef} x={200} y={100} radius={50} fill="green" />
        </Layer>
        <Layer>
          {lines.map((line, i) => (
            <Arrow
              key={i}
              // bezier
              points={line.points}
              stroke="#36C2CE"
              strokeWidth={5}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                // "line.tool" === "eraser" ? "destination-out" : "source-over"
                "source-over"
              }
            />
          ))}
        </Layer>
        <Layer>
          {bezierPoints.map((point, i) => {
            return (
              <Circle
                key={i}
                x={point.x}
                y={point.y}
                scaleX={0.1}
                scaleY={0.1}
                radius={50}
                fill={"red"}
              />
            );
          })}
          {/* {linePointsToVector2d(lines[lines.length - 1].points).map((point, i) => {
            return (
              <Circle
                key={i}
                x={point.x}
                y={point.y}
                scaleX={0.1}
                scaleY={0.1}
                radius={50}
                fill={"blue"}
              />
            );
          })} */}
        </Layer>
      </Stage>
      <div className="divider" />

      <div>
        <button className="reset-button" onClick={handleResetDrawing}>
          Reset Drawing
        </button>
        <button className="reset-button" onClick={handleResetObject}>
          Reset Object
        </button>
      </div>

      <div className="row">
        <div className="column">
          <textarea
            className="prompt-text-area"
            value={prompt}
            onChange={handlePromptTextAreaChange}
          />
          <button className="animate-button" onClick={handleAnimate}>
            Animate
          </button>
          <button className="reset-button" onClick={handleReplay}>
            Replay
          </button>
        </div>
        <div className="column json-section">
          <h3>Result Json</h3>
          {jsonStr}
        </div>
      </div>
    </div>
  );
};

export default App;

// useEffect(() => {
//   const circle = circleRef.current
//   const centerX = 500
//   if (!circle) return

//   const anim = new Konva.Animation((frame) => {
//     circle.x(centerX + 100 * Math.cos(frame.time / 1000));
//   }, circle.getLayer());
//   anim.start();
// }, [])<e className="target value"></e>

// const tween = new Konva.Tween({
//   node: circle,
//   duration: 1,
//   x: 500,
//   y: 90,
//   fill: 'red',
//   // rotation: Math.PI * 2,
//   opacity: 1,
//   strokeWidth: 6,
//   scaleX: 1.5,
//   scaleY: 1.5,
//   easing: Konva.Easings.EaseOut,
//   onFinish: handleOnFinish
// });

// tween.play()

// const tween = new Konva.Tween({
//   node: circle,
//   duration: 1,
//   x: 500,
//   y: 90,
//   fill: 'red',
//   opacity: 1,
//   strokeWidth: 6,
//   scaleX: 1.5,
//   scaleY: 1.5,
//   easing: Konva.Easings.ElasticEaseOut,
//   // yoyo: true,
//   onFinish: handleOnFinish
// });

// tween.play();

// const horizontalTween = new Konva.Tween({
//   node: circle,
//   duration: 0.6,
//   x: 800,
//   easing: Konva.Easings.Linear,
//   // yoyo: true,
//   // onFinish: handleOnFinish
// });

// const verticalTween = new Konva.Tween({
//   node: circle,
//   duration: 0.6,
//   y: 400,
//   easing: Konva.Easings.EaseOut,
//   // yoyo: true,
//   // onFinish: handleOnFinish
// });

// const verticalTween2 = new Konva.Tween({
//   node: circle,
//   duration: 0.5,
//   y: 300,
//   easing: Konva.Easings.BounceEaseOut,
//   // yoyo: true,
//   onFinish: handleOnFinish
// });

// horizontalTween.play();
// verticalTween.play();
// setTimeout(() => {
//   const scaleTween = new Konva.Tween({
//     node: circle,
//     duration: 0.5,
//     scaleX: 1.5,
//     scaleY: 1.5,
//     easing: Konva.Easings.EaseOut,
//     // yoyo: true,
//     // onFinish: handleOnFinish
//   });
//   scaleTween.play();
// }, 450);
