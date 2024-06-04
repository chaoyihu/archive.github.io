---
layout: base
title: Projects
permalink: /projects/ultrasound-image-segmentation
---

# Semantic Segmentation of Ultrasound Images

In this project, we collaborated with clinicians at Beijing Anzhen Hospital to build a modified U-Net that segments anatomical structures in ultrasound images.

I was responsible for organizing image files, developing preprocessing functions of ultrasound images, visualizing the results, and reproducing the FCN baseline model. Most of these tasks were completed using Python, and some with MATLAB and Excel.

Clinical doctors provided us with apical view ultrasound images of fetal hearts, together with ground truth labels of anatomical structures including atria, ventricles, descending aorta, etc.

![data sample](/assets/images/ultrasound-project-label.png)

Using Python and MATLAB, I was able to preprocess the ultrasound images. This include steps such as linear transformations, resampling, histogram normalization, and denoising. I also used some of these functions for data augmentation.

The preprocessed data was then fed to a model called DW-Net, which is a modified version of the U-Net architecture used for medical image segmentation.

![network](/assets/images/ultrasound-project-network.png)

As shown below, DW-Net outperforms common baseline models on the same segmentation task, achieving higher AUC with higher quality outputs.

![result](/assets/images/ultrasound-project-result.png)
![roc](/assets/images/ultrasound-project-roc.png)
