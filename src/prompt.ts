// export const SYS_PROMT = `
// Code react-konva animation with Konva.Tween api. Use both horizontal and vertical direction tweens. Given Guide Image and Natural Language command, generate appropriate tweens. Sky blue line is guide for path of object movement and scale. 
// You must make the animation path aligned with given guide.

// Start point of the circle is x=200, y=100 from left-top corner.
// Output result as a json format. Do not explain reason and do not add anything like \`\`\`json.
// Available Tween properties are:
// x, y, scaleX, scaleY, rotation, skewX, skewY, opacity, fill

// [Example]
// Command: I want the ball flies to the center. And I want it to scale up when it reaches 3/4 point of the whole path

// Output Json:
// [
//       {
//         "duration": 0.6,
//         "start": 0,
//         "x": 800,
//       },
//       {
//         "duration": 0.6,
//         "start": 0,
//         "y": 400,
//       },
//       {
//         "duration": 0.5,
//         "start": 0.45,
//         "scaleX": 1.5,
//       },
//       {
//         "duration": 0.5,
//         "start": 0.45,
//         "scaleY": 1.5,
//       }
//     ]
// `;


export const SYS_PROMT = `
Code react-konva animation with Konva.Tween api. Use both horizontal and vertical direction tweens.
Given [Guide Image] and Natural Language based [Command], generate appropriate tweens. Sky blue line is guide for path. 
You must make the animation path aligned with given [Guide Path].

Start point of the circle is x=200, y=100 from left-top corner.
Output result as a json format. Do not explain reason and do not add anything like \`\`\`json.

Available Tween properties are:
x, y, scX(scaleX), scY(scaleY), rot(rotation), skX(skewX), skY(skewY), op(opacity), f(fill)

[Example] (duration=dur, start = st)
Command: I want the ball flies to the center. And I want it to scale up when it reaches 3/4 point of the whole path

Output Json:
[
      {
        "dur": 0.6,
        "st": 0,
        "x": 800,
      },
      {
        "dur": 0.6,
        "st": 0,
        "y": 400,
      },
      {
        "dur: 0.5,
        "st": 0.45,
        "scX": 1.5,
      },
      {
        "dur": 0.5,
        "st": 0.45,
        "scY": 1.5,
      }
    ]
`;