---
layout: base
title: Projects
permalink: /projects/eeg-attention-fatigue
---

# Drowsiness detection based on EEG signals

Source Code: [![chaoyihu - eeg-attention-fatigue](https://img.shields.io/static/v1?label=chaoyihu&message=eeg-attention-fatigue&color=blue&logo=github)](https://github.com/chaoyihu/eeg-attention-fatigue)

## Background

Prolonged tasks, such as driving, requires the operator to be constantly alert and focused to deal with emergencies that may arise at any time. Monitoring the operator's attentional level and detect for drowsiness during such prolonged tasks can help ensure operational safety and optimize task outcomes.

Electroencephalogram (EEG) signals, i.e. electric brain signals, can be used as a non-invasive, real-time approach for attentional level monitoring. This study uses scalp EEG signals collected from human subjects during simulated driving tasks to train and evaluate machine learning models that detects drowsy states.

## My Role

My role in this project include:
- Preprocessed EEG data in Python, and periodically backed up local data using bash scripts.
- Transformed raw data to construct vector input for ML models.
- Established machine learning classifiers to identify human EEG signals in alert vs drowsy states.

## Method

Raw EEG data comes in as .edf files, a standard file format for medical time series data. It first goes through preprocessing steps as follows, which includes bandpass filtering, resampling, re-referencing, etc. and finally sliced to short sequences 2-second in length.

![preprocessing](/assets/images/eeg-project-preprocessing.jpeg)

I developed scripts to extract features such as power values at certain frequency bands and sample entropy values from EEG signals at different attentional levels, then visualized them and selected features based on separability. We also explored the option of using PCA for dimension reduction of the feature vector.

![features](/assets/images/eeg-project-features.png)

To actually monitor attentional level in real-time, raw signals will come in as a stream and manual preprocessing cannot be done. Therefore, I automated this preprocessing process, and produced normalized plots and measurements in batch using this automated preprocessing pipeline for quality control purposes. Test ran on consumer CPU shows that preprocessing on a 2-channel, 1000 sample point signal snippet took less than 5ms, confirming that it can be used for real-time models.

![qc](/assets/images/eeg-project-qc.png)

The experiment uses ML classifiers including Gbdt, SVM, Logistic regression, which took feature vectors as input.

We also experimented using an end-to-end DL model (CNN) which took raw signals as input, though in hindsight RNN would probably be more suited for such a task.

EEG signal features are highly individualized and can vary between different subjects. For this reason, the study designed single-subject and multi-subject experiment schemes to develop a robust model with better versatility.

![scheme](/assets/images/eeg-project-scheme-1.png)
![scheme](/assets/images/eeg-project-scheme-2.png)
![scheme](/assets/images/eeg-project-scheme-3.png)

## Result

- Are the models effective?

  Yes. In single-subject tests, where we train and evaluate the models using data from the same subject, Gbdt classifiers achieved 86% accuracy, while CNN achieved near perfect accuracy with a lower standard deviation.


- Are the models versatile?

  Not if you train on with single-subject data. In cross-subject test, where we train on EEG data from one subject and predicts on data from a different subject, the accuracy will generally be unsatisfactory with an average accuracy at ~0.38, as seen in the result matrix below.

![cross-subject](/assets/images/eeg-project-individualized.png)

- Can the versatility be improved?

  Yes. In multi-subject tests, we train the models using data from the 15 subjects, and evaluate on a different subject. Compared to the accuracy of cross test, we see that expanding and diversifying the training set gives better results (CNN: 0.51, Gbdt: 0.46).

## Discussion

We did noticed from our result confusion matrix that neighboring levels tend to get mixed up. The reason might be that we are categorizing attentional levels into 3 states: high/medium/low, whereas in fact, the attentional level should be a continuous variable with unknown distribution:

![discussion-continuous](/assets/images/eeg-project-discussion-1.png)

I conducted an additional bi-classification experiment to test this suspicion, and the accuracy was indeed improved, which suggests that it is probably a valid consideration to take the attentional level as a continuous variable:

![discussion-continuous](/assets/images/eeg-project-discussion-2.png)

Other discussions include choosing EEG signal processing parameters, for example, rejection threshold and quality control, and using other methods (such as eye movement detection) to supplement EEG signal in attentional level monitoring.

If interested, please visit this pdf document for a full project presentation: [EEG-based Models for Automatic Discrimination of Mental Attentional Levels](https://github.com/chaoyihu/eeg-attention-fatigue/blob/master/doc/A%20Comparative%20Study%20on%20EEG-based%20Models%20for%20Automatic%20Discrimination%20of%20Mental%20Attentional%20Levels%20during%20Operation%20of%20a%20Flight%20Simulator.pdf)