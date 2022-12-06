<!-- Equivalent to frequent values explanation -->

##### What to look for:

A large number of duplicate numbers can be caused by data manipulation. Either typing numbers manually or copying/pasting regions of numbers can produce this effect. Highlighting duplicate numbers and searching for repeated regions of numbers can provide further evidence if data has been manipulated or not.

##### Caveats:

Determining if the number of duplicates is unusual or not can be difficult. A large number of duplicates could have several causes:

-   There is a small range of possible values compared to the number of data points.
-   The data have been clamped to an upper/lower bound.
-   A common cause of duplicate numbers and sequences of digits that may seem suspicious at first, but is typically innocent are high-precision duplicates caused by converting measurements. For example, converting fractions to decimals could introduce duplicates with seemingly high precision. If an experiment recorded the length of an animal in inches as integers, but in a subsequent step, the data would be converted to feet using decimals, we would expect that the resulting decimals have values with high precision, such as $0.33333333$ and $0.41666667$. In this case, the number $0.33333333$ may appear more often than naively expected and an n-gram of digits, such as $3$s, or $6$s may appear frequently.

##### External References

-   [Birthday Paradox](https://en.wikipedia.org/wiki/Birthday_problem)
