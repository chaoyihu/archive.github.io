---
layout: base
title: Projects
permalink: /projects/mri-alzheimer
---

# Detection of Alzheimer’s Disease Based on MRI Data

This project develops a classifier for early Alzheimer detection using Python, MATLAB and SPM based on structural and functional MRI data from [the ADNI database](http://adni.loni.usc.edu/).

In this project, I was responsible for:
- Preprocessing of sMRI and fMRI data.
- Extraction and dimension reduction of features such as ALFF and ReHo from MRI data.
- Develop a classifier to distinguish between Alzheimer and cognitively normal data.
- Visualize the results in brain atlas and interpret the results from an anatomical perspective.

# Preprocessing

The data consists of T1 image and fMRI scan of groups of cognitively normal (CN) subjects and Alzheimer patients (AZ). Below is an inspection view of slices of the sample data.

![data](/assets/images/mri-project-data.png)

In collaboration with group members, I used Python, MATLAB and the SPM toolkit to preprocess the imaging data. This includes the following steps:
- Slice timing, since MRI scan was actually sequential scans assumed to be acquired simultaneously.
- Movement correction, to align the images since the subject might have moved during the scan.
- Registration, to align T1 image to the functional image.
- Bet, to remove skull and scalp.
- Normalization, to map subject images to the standard EPI template, for consistency of analysis of multiple subjects.
- Smoothing.

Then, I used Python to extract voxel-based features such as ALFF, fALFF, ReHo and Degree Centrality from the data as .nii files. Our group also extracted other features including functional connectivity between >110 nodes and time series in certain ROIs. I experimented with PCA and voxel-based methods for dimension reduction of the feature vector. Below is a graph reflecting the distribution of voxel-based features between CN and AZ groups.

![feature](/assets/images/mri-project-feature.png)

Finally, I visualized the result by locating the voxels with most separable features in a brain atlas. The results are medically meaningful since these voxels are mainly distributed in brain areas proven relevant to early Alzheimer.

![result](/assets/images/mri-project-result.png)