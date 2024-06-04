---
layout: base
title: Projects
permalink: /projects/behavioral-experiment
---

# Development of laboratory software tools to assist animal experiment

In my internship at Columbia University, I was given the task of assisting a behavioral experiment, in which the research team evaluates the memory performance of groups of mice undergoing certain treatment procedures.

Mice were trained over a period of weeks to months to memorize a maze with baits at fixed locations, and the process was recorded as video sessions. Following figure illustrates the experiment setting with the trail of mice visualized in red, and the scatter graph visualized mouse movement over the training session.

![1](/assets/images/maze-setting.png)

I developed a video processing pipeline in Python based on OpenCV, Numpy, Pandas, and some existing video processing functions the lab had in place. The pipeline ingests video recordings, tracks the movement of mice, analyzes the trail, and extracts meaningful metrics from it. I also developed a visualization script to run routinely at the end of each experiment day whenever new data comes in, and sent the graphs to an MD student for inspection.

The graph below is a visualization example of some key metrics produced from the pipeline for subsequent analysis.

![1](/assets/images/maze-result.png)

The experiment had been going on for a while before I joined, and there was a huge backlog with hundreds of video sessions to be processed. Manual processing would have been time-consuming, so after testing and working with this pipeline for several weeks, I moved on to develop a batch processing feature that orchestrates backlog data, ran them through the individual pipeline and produces a summary of results in spreadsheet.

Besides that, I developed a GUI using Python tkinter to make the process of appending new video files with its metadata easier.