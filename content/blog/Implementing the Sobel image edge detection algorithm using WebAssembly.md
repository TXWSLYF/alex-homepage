---
author: Alex
pubDatetime: 2023-08-20T10:33:00+09:00
title: Implementing the Sobel image edge detection algorithm using WebAssembly
postSlug: ""
tags:
  - WebAssembly
  - image edge detection
featured: false
draft: false
ogImage: ""
description: Implementing the Sobel image edge detection algorithm using WebAssembly
---

I heard about [WebAssembly](https://webassembly.org/) a long time ago and have a general idea that it offers high execution speed, suitable for scenarios with high-performance requirements like gaming, image/video editing, and more.

So this time, I plan to try implementing the [Sobel](https://en.wikipedia.org/wiki/Sobel_operator) image edge detection algorithm separately using native JavaScript and WebAssembly to compare the performance difference between the two.

Here, I won't delve into the detailed implementation of the Sobel algorithm, but rather focus on how to implement it using WebAssembly.

Thanks to [miguelmota](https://github.com/miguelmota/sobel), there is already a ready-made JavaScript version implementation of the Sobel algorithm, what I need to do is translate it into C++ and compile it into WebAssembly.

```c
// sobel.c

#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <emscripten/emscripten.h>
#include <stdint.h>

EMSCRIPTEN_KEEPALIVE
uint8_t *create_buffer(int width, int height)
{
    return malloc(width * height * 4 * sizeof(uint8_t));
}

EMSCRIPTEN_KEEPALIVE
void destroy_buffer(uint8_t *p)
{
    free(p);
}

int result[1];
EMSCRIPTEN_KEEPALIVE
void sobel(uint8_t *img_in, int width, int height)
{
    uint8_t *img_out;
    img_out = (uint8_t *)malloc(width * height * 4 * sizeof(uint8_t));

    const int Gx[3][3] = {
        {-1, 0, 1},
        {-2, 0, 2},
        {-1, 0, 1}};

    const int Gy[3][3] = {
        {-1, -2, -1},
        {0, 0, 0},
        {1, 2, 1}};

    for (int y = 1; y < height - 1; y++)
    {
        for (int x = 1; x < width - 1; x++)
        {
            int sumX = 0;
            int sumY = 0;

            for (int j = 0; j < 3; j++)
            {
                for (int i = 0; i < 3; i++)
                {
                    const int pixelIndex = (y + j - 1) * width + (x + i - 1);
                    const int pixelValue = img_in[pixelIndex * 4];

                    sumX += pixelValue * Gx[j][i];
                    sumY += pixelValue * Gy[j][i];
                }
            }

            int gradientMagnitude = sqrt(sumX * sumX + sumY * sumY);
            const int outputPixelIndex = (y * width + x) * 4;

            // Converting an int to uint8_t may result in overflow
            if (gradientMagnitude > 255)
            {
                gradientMagnitude = 255;
            }

            img_out[outputPixelIndex] = gradientMagnitude;
            img_out[outputPixelIndex + 1] = gradientMagnitude;
            img_out[outputPixelIndex + 2] = gradientMagnitude;
            // Alpha channel
            img_out[outputPixelIndex + 3] = 255;
        }
    }

    result[0] = (int)img_out;
}

EMSCRIPTEN_KEEPALIVE
void free_result(uint8_t *result)
{
    free(result);
}

EMSCRIPTEN_KEEPALIVE
int get_result_pointer()
{
    return result[0];
}
```

Then, we can compile the C code into WebAssembly. I use Docker to run the command, and you can find a guide on how to install Emscripten [here](https://emscripten.org/docs/getting_started/downloads.html).

```shell
docker run --rm -v $(pwd):/src -u $(id -u):$(id -g) \
  emscripten/emsdk emcc sobel.c -O3 -o sobel.js -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap"]'
```

After compilation, we got two files: sobel.js and sobel.wasm, where sobel.js is the glue code, and sobel.wasm is the WebAssembly code.

Then let's write the html and javascript to test the function.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <style>
      canvas {
        border: 1px solid;
      }
    </style>
  </head>
  <body>
    <div><input type="file" id="input-file" /></div>
    <div>
      <p>Original image</p>
      <canvas id="canvas1"></canvas>
    </div>
    <div>
      <p>WebAssembly sobel</p>
      <canvas id="canvas2"></canvas>
    </div>

    <div>
      <p>Javascript sobel</p>
      <canvas id="canvas3"></canvas>
    </div>

    <script src="./sobel.js"></script>
    <script src="./index.js"></script>
  </body>
</html>
```

```javascript
const inputFile = document.getElementById("input-file");
const canvas1 = document.getElementById("canvas1");
const canvas2 = document.getElementById("canvas2");
const canvas3 = document.getElementById("canvas3");

const ctx1 = canvas1.getContext("2d", { willReadFrequently: true });
const ctx2 = canvas2.getContext("2d", { willReadFrequently: true });
const ctx3 = canvas3.getContext("2d", { willReadFrequently: true });

async function loadImage(src) {
  // Load image
  const imgBlob = await fetch(src).then(resp => resp.blob());
  const img = await createImageBitmap(imgBlob);
  // Make canvas same size as image
  canvas1.width = img.width;
  canvas1.height = img.height;

  // Draw image
  ctx1.drawImage(img, 0, 0);
  return ctx1.getImageData(0, 0, img.width, img.height);
}

const Gx = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1],
];
const Gy = [
  [-1, -2, -1],
  [0, 0, 0],
  [1, 2, 1],
];

// Sobel image edge detection algorithm in Javascript
function sobelAlgorithm(imageData) {
  const width = imageData.width;
  const height = imageData.height;
  const outputData = new Uint8ClampedArray(imageData.data.length);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sumX = 0;
      let sumY = 0;

      for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 3; i++) {
          const pixelIndex = (y + j - 1) * width + (x + i - 1);
          const pixelValue = imageData.data[pixelIndex * 4];
          sumX += pixelValue * Gx[j][i];
          sumY += pixelValue * Gy[j][i];
        }
      }

      const gradientMagnitude = Math.sqrt(sumX * sumX + sumY * sumY);
      // Rounding to an integer
      const normalizedMagnitude = gradientMagnitude >>> 0;

      const outputPixelIndex = (y * width + x) * 4;
      outputData[outputPixelIndex] = normalizedMagnitude;
      outputData[outputPixelIndex + 1] = normalizedMagnitude;
      outputData[outputPixelIndex + 2] = normalizedMagnitude;
      outputData[outputPixelIndex + 3] = 255; // Alpha channel
    }
  }

  return new ImageData(outputData, width, height);
}

// Detect image edges using the Sobel algorithm in both native JavaScript and WebAssembly, and draw them to canvas
function appleSobelDrawImageData(api, imageData) {
  const { width, height } = imageData;

  canvas2.width = width;
  canvas2.height = height;
  canvas3.width = width;
  canvas3.height = height;

  const p = api.create_buffer(width, height);
  Module.HEAPU8.set(imageData.data, p);

  console.time("codeExecution c++");
  api.sobel(p, width, height);
  console.timeEnd("codeExecution c++");

  const resultPointer = api.get_result_pointer();
  const resultView = new Uint8ClampedArray(
    Module.HEAPU8.buffer,
    resultPointer,
    width * height * 4
  );
  api.free_result(resultPointer);
  api.destroy_buffer(p);

  const outImageData = new ImageData(resultView, width, height);
  ctx2.putImageData(outImageData, 0, 0);

  console.time("codeExecution javascript");
  const sobelData = sobelAlgorithm(imageData);
  console.timeEnd("codeExecution javascript");

  ctx3.putImageData(sobelData, 0, 0);
}

Module.onRuntimeInitialized = _ => {
  // Create wrapper functions for all the exported C functions
  const api = {
    create_buffer: Module.cwrap("create_buffer", "number", [
      "number",
      "number",
    ]),
    destroy_buffer: Module.cwrap("destroy_buffer", "", ["number"]),
    gray_scale: Module.cwrap("gray_scale", "", ["number", "number", "number"]),
    sobel: Module.cwrap("sobel", "", ["number", "number", "number"]),
    free_result: Module.cwrap("free_result", "", ["number"]),
    get_result_pointer: Module.cwrap("get_result_pointer", "number", []),
  };

  loadImage("bocchi.JPG").then(imageData => {
    appleSobelDrawImageData(api, imageData);
  });

  inputFile.addEventListener("change", event => {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();

        img.onload = function () {
          const { width, height } = img;
          canvas1.width = width;
          canvas1.height = height;
          ctx1.drawImage(img, 0, 0);
          const imageData = ctx1.getImageData(0, 0, width, height);

          appleSobelDrawImageData(api, imageData);
        };

        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
};
```

And the result, pretty good.
![Sobel image edge detection](./00050820.png)

Performance Comparison between JavaScript and WebAssembly, achieving nearly tenfold speed improvement.

```shell
codeExecution c++: 12.4970703125 ms
codeExecution javascript: 100.006103515625 ms
```

You can find the source code for this example [here](https://github.com/TXWSLYF/sobel-example-wasm-c/tree/main), and you can try it out online [here](https://txwslyf.github.io/sobel-example-wasm-c/index.html).The algorithm's execution time will be logged to the console.

## Reference Links

0) https://developer.mozilla.org/en-US/docs/WebAssembly/C_to_wasm
1) https://developer.mozilla.org/en-US/docs/WebAssembly/existing_C_to_wasm
2) https://web.dev/emscripting-a-c-library/
3) https://github.com/GoogleChrome/samples/tree/gh-pages/webassembly
4) https://www.cntofu.com/book/150/zh/ch2-c-js/ch2-04-data-exchange.md
