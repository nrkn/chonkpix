# chonkpix
 
a stupidly simple chonky pixel engine

defers pretty much everything to the scene, just provides a basic harness
for handling input, timing, rendering etc

extensive lib for pixel bashing etc

this is pretty flexible - for example you can have multiple scenes 
concurrently by having a single scene act as a manager and dispatching to
its child scenes, intercepting the main state and passing decorated versions
to the children so that mouse is relative to the child scene position, they
can have their own frame buffer which gets blitted to the main one, keys and
mouse only go to the active scene etc etc

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
- scene manager
  - move between scenes (basic, just toggle through list for now)
- drawing library
  - blit
  - composite
  - fill
  - line 
  - triangle
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

- come up with a name
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
- write rest of todo list - ref chat

## ideas/maybe todo

- write ideas list - ref chat

## todo when stable

don't do these while everything is changing around all the time!

- documentation
- examples tailored to understanding engine and library

## MIT License

- add license text

