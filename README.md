# Ferret: Reviewing Tabular Datasets for Manipulation
Devin Lange, Shaurya Sahai, Jeff M. Phillips, Alexander Lex

Publication: [10.1111/cgf.14822](https://dx.doi.org/10.1111/cgf.14822)

Project Site: [ferret.sci.utah.edu](https://ferret.sci.utah.edu)

Additional Info: [vdl.sci.utah.edu/publications/2023_eurovis_ferret/](https://vdl.sci.utah.edu/publications/2023_eurovis_ferret/)

## About

Ferret is a a visualization tool designed to help review tabular datasets for signs that the data has been manipulated. The tool is based on a [living document](https://ferret.sci.utah.edu/artifacts.html) of artifacts of manipulation.

The tool is deployed with ten example datasets at https://ferret.sci.utah.edu. Users can also upload their own excel files to view in the tool.

![ferret_teaser](https://user-images.githubusercontent.com/6709955/226423673-08ff04aa-a892-40f8-b740-75e433c419b0.png)

## Developer Information

This site is deployed on Netlify.

[![Netlify Status](https://api.netlify.com/api/v1/badges/d33e3e53-0a69-4a44-89b3-7db16d7706d1/deploy-status)](https://app.netlify.com/sites/vdl-ferret/deploys)

### Build instructions

Prereqs:

Node, gulp, browserify, watchify
- https://www.typescriptlang.org/docs/handbook/gulp.html

Installation steps:

`git clone https://github.com/visdesignlab/data-forensics.git`

`cd data-forensics/`

`npm install`

To build/run:
`gulp`
