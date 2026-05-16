---
title: "SpikeStereoNet: A Brain-Inspired Framework for Stereo Depth Estimation from Spike Streams"
collection: publications
category: conferences
permalink: /publication/spikestereonet
excerpt: 'Accepted as a poster at ICLR 2026. We propose a brain-inspired framework for stereo depth estimation directly from raw spike streams.'
date: 2026-01-26
venue: 'ICLR 2026'
paperurl: 'https://openreview.net/pdf?id=lPMPFeioCZ'
bibtexurl: '/files/bibtex1.bib'
citation: 'Zhuoheng Gao, Yihao Li, Jiyao Zhang, Rui Zhao, Tong Wu, Hao Tang, Zhaofei Yu, Hao Dong, Guozhang Chen, and Tiejun Huang. (2026). &quot;SpikeStereoNet: A Brain-Inspired Framework for Stereo Depth Estimation from Spike Streams.&quot; <i>ICLR 2026</i>.'
---

**Authors:** Zhuoheng Gao, Yihao Li, Jiyao Zhang, Rui Zhao, Tong Wu, Hao Tang, Zhaofei Yu, Hao Dong, Guozhang Chen, and Tiejun Huang.

**Venue:** ICLR 2026 Poster

**Links:** [OpenReview page](https://openreview.net/forum?id=lPMPFeioCZ) | [PDF](https://openreview.net/pdf?id=lPMPFeioCZ)

**Abstract:**

Conventional frame-based cameras often struggle with stereo depth estimation in rapidly changing scenes. In contrast, bio-inspired spike cameras emit asynchronous events at microsecond-level resolution, providing an alternative sensing modality. To address the lack of stereo algorithms and benchmarks tailored to spike data, we propose SpikeStereoNet, a brain-inspired framework that estimates stereo depth directly from raw spike streams. The model fuses raw spike streams from two viewpoints and iteratively refines depth through a recurrent spiking neural network update module. We further introduce a large-scale synthetic spike-stream dataset and a real-world stereo spike dataset with dense depth annotations. SpikeStereoNet outperforms existing methods on both datasets while showing strong data efficiency under reduced training data.
