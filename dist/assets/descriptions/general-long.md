##### What to look for:

So far, we have assumed that artifacts are visible in the formatting, structure, or values of the data. However, authors may use more sophisticated techniques for generating fabricated data that cannot be detected with the aforementioned methods. In these situations, analyzing the data in variety of ways helps verify if there are any deviations from domain expectations.

###### Single-Dimensional

In the case of a single dimension of data, there is often prior knowledge about how that data should look, at least in the aggregate. For instance, many natural measurements, such as the weight of an animal, will exhibit a normal distribution. We consider drastic variations from these expectations, such as a uniform distribution occurring when a normal distribution is expected, or a normal distribution with an obviously clipped tail, to be a single-dimensional domain artifact.

###### Relational

If authors are careful, a single column of fabricated data may be indistinguishable from authentic data. However, ensuring that all columns have a reasonable (based on domain expectations) relationship with all other columns is a more difficult task. For example, if an experiment measured the length and weight of an animal, there likely should be a correlation between the two values (longer animals of the same species are likely to be heavier, on average). If such data is generated or manipulated using, for example, spreadsheet functions for individual columns, the data may look innocent when only looking at one column, but the relationships between columns may not be meaningful. Hence, a dataset exhibits a relational artifact when the relationships between columns differ from expectations.

<!-- ##### Useful Resources: -->
