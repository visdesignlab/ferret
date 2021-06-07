This chart shows the frequency of all possible non-zero leading digits. The y-axis encodes the frequency of each digit, between $0$ and $1$. The x-axis encoudes the leading digit.

![Leading Digit Frequency Chart](./assets/descriptions/leading-digit-frequency.svg)

This can be helpful for scenarios where Benford's Law applies. **However**, there are many scenarios where you wouldn't expect Benford's Law to apply. For instance, the plot above doesn't adhere to Benford's Law because the data does not span more than one order of magnitude, so you are only seeing the distribution of data.

### External References
* [Benford's Law](https://en.wikipedia.org/wiki/Benford%27s_law)