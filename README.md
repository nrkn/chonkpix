# chonkpix
 
a stupidly simple chonky pixel engine

created for me to do experiments with pixel art, palettes, text rendering etc

this is *not* designed to be the most performant or extensive 2D game engine!

it is designed to be fun for me to use

defers pretty much everything to the scene, just provides a basic harness
for interacting with the browser, handling input, timing, rendering etc

includes extensive lib for pixel bashing etc

## done

- engine
  - input
    - keyboard
    - mouse
  - timing
    - elapsed
    - frameTime
  - rendering
    - imageData as frame buffer
    - pixel scaling via zoom setting
  - start scene
  - tear down scene
- scenes
  - image test scene
  - text/terminal test scene
  - scene compositor (just basic horizontal split for now)
  - palette test scene
- scene manager
  - move between scenes (basic, just toggle through list for now)
- drawing library
  - blit
  - composite
  - fill
  - line 
  - triangles
  - more
- palettes
  - generate palettes
  - LUTs  
- text/bitmap fonts
  - mono
  - proportional
  - layout
- terminal
  - backed by buffer
  - clear
  - append
  - appendLine
  - backspace
  - view 
    - take (cols,rows) and slice bottom of buffer to available space

## todo

- engine
  - sound, via small sound library like ZzFX or similar
- terminal
  - cursor
  - scroll  
  - delete
  - history
  - add more
- quickstart 
  - very simple 'how to do things' while it is in flux
- examples
  - just fun or to demo features at first
- write rest of todo list

## ideas/maybe todo

- write ideas list

## todo when stable

don't do these while everything is changing around all the time!

- documentation
- examples tailored to understanding engine and library

## MIT License

MIT License

Copyright (c) 2025 Nik Coughlin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
