import "./App.css";

import React, { useEffect, useState, useRef, LegacyRef } from "react";
import { createRoot } from "react-dom/client";
import { Stage, Layer, Rect, Text, Circle, Line } from "react-konva";
import Konva from "konva";
import { NodeConfig } from "konva/lib/Node";

import OpenAI from "openai";

interface LineConf {
  points: number[];
}

const SYS_PROMT = `
Code react-konva animation with Konva.Tween api. Use both horizontal and vertical direction tweens. Given Guide Image and Natural Language command, generate appropriate tweens. Sky blue line is guide for path of object movement and scale. 
You must make the animation path aligned with given guide.

Start point of the circle is x=200, y=100 from left-top corner.
Output result as a json format. Do not explain reason and do not add anything like \`\`\`json.
Available Tween properties are:
x, y, scaleX, scaleY, rotation, skewX, skewY, opacity, fill

[Example]
Command: I want the ball flies to the center. And I want it to scale up when it reaches 3/4 point of the whole path

Output Json:
[
      {
        "duration": 0.6,
        "start": 0,
        "x": 800,
      },
      {
        "duration": 0.6,
        "start": 0,
        "y": 400,
      },
      {
        "duration": 0.5,
        "start": 0.45,
        "scaleX": 1.5,
      },
      {
        "duration": 0.5,
        "start": 0.45,
        "scaleY": 1.5,
      }
    ]
`;

const SAMPLE_PROMPT = `I want the ball flies to the center. And I want it to scale up and change its color to red when it reaches 3/4 point of the whole path
`

const App = () => {
  // const [tool, setTool] = useState("pen");
  const [lines, setLines] = useState<LineConf[]>([]);
  const isDrawing = useRef(false);

  const [jsonStr, setJsonStr] = useState("Idle")
  const [prompt, setPrompt] = useState(SAMPLE_PROMPT)


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

  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e) => {
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
  };

  const handleResetDrawing = () => {
    setLines([]);
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

    if (!circleRef.current || !clientRef.current) return;
    const circle = circleRef.current;
    const client = clientRef.current;

    const completion = await client.chat.completions.create({
      messages: [
        { role: "system", content: SYS_PROMT },
        {
          role: "user",
          content: [
            { type: "text", text: "[Guide Image]" },
            {
              type: "image_url",
              image_url: {
                url: uri,
              },
            },
          ],
        },
        {
          role: "user",
          content: `
            [Command]\n${prompt}`,
        },
      ],
      model: "gpt-4o",
    });
    const jsonString = completion.choices[0].message.content;
    console.log(jsonString);

    if (!jsonString) {
      console.log("json error");
      return;
    }

    const safeJsonString = jsonString.replace(/,(?=\s*[\]}])/g, '')
  
    setJsonStr(safeJsonString)

    const jsonRes: Object[] = JSON.parse(safeJsonString);
    console.log(jsonRes);
    jsonRes.forEach((tweenJson) => {
      const duration = tweenJson["duration"];
      const start = tweenJson["start"];
      let valueField = "x";

      if (tweenJson.hasOwnProperty("y")) valueField = "y";
      else if (tweenJson.hasOwnProperty("scaleX")) valueField = "scaleX";
      else if (tweenJson.hasOwnProperty("scaleY")) valueField = "scaleY";
      else if (tweenJson.hasOwnProperty("skewX")) valueField = "skewX";
      else if (tweenJson.hasOwnProperty("skewY")) valueField = "skewY";
      else if (tweenJson.hasOwnProperty("opcity")) valueField = "opacity";
      else if (tweenJson.hasOwnProperty("fill")) valueField = "fill";
      
      setTimeout(() => {
        const tween = new Konva.Tween({
          node: circle,
          duration: duration,
          [valueField]: tweenJson[valueField],
          easing: Konva.Easings.EaseInOut,
        });
        console.log(tween)
        console.log(`${start} ${duration} ${valueField} ${tweenJson[valueField]}`)
        tween.play();
      }, start);
    });
  };

  const handlePromptTextAreaChange = (e) => {
    const newPrompt = e.target.value
    setPrompt(newPrompt)
  }

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
            <Line
              key={i}
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
          <textarea className="prompt-text-area" value={prompt} onChange={handlePromptTextAreaChange}/>
          <button className="animate-button" onClick={handleAnimate}>
          
            Animate
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
