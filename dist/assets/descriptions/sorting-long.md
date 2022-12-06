##### What to look for:

The structure of data can also play a role in detecting manipulation. Structural patterns are concerned with both the value of measurements and the order of the observations in the data file.

###### Repeated Regions:

While six duplicate numbers may be considered a weak signal of manipulation, two identical sequences of six numbers are a much stronger one. We consider a region to consist of multiple cell values that have a spatial relationship in a spreadsheet. While the simplest example is a sequence of numbers in a column, regions include adjacent patterns, vertically or horizontally, and may include gaps. Repeated regions can be artifacts of manipulation. While some repeated regions could be caused by how the data is collected, such an innocuous structure is likely obvious.

###### Ordering:

It is natural for ordering artifacts to exist in authentic datasets. For instance, if multiple observations are recorded over time it would be expected that time increases throughout the dataset. Some consider it a good practice to avoid changing the order of a dataset. However, it is not uncommon and not automatically suspicious that data is re-sorted.

The ordering of the data can still indicate manipulation. For example, if a bad actor wants to show that an experimental condition has an effect on the weight of animals, they might sort the data based on weight. Then, they might modify values at the distribution's tails --- altering the data to match their hypothesis. This is an economical approach since changing the extreme values will have the largest effect on aggregate measurements. However, this approach can leave behind ordering artifacts. This kind of dataset where a column is nearly sorted is one example of an ordering artifact. If the order is reset after modifications, such a pattern might be difficult to detect. However, if the data is reset by sorting on a column with duplicates (e.g., by a categorical value), then the effects of sorting on weight before the reset will still be seen within the groups. This kind of ghost sorting is another variation of an ordering artifact.
