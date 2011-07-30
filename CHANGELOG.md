# v0.1.4 (2011/07/30)

- Fixed a bug with numeric values, such as `opacity`
- Ensured Morf tidies up after itself when using native transitions. Otherwise future CSS changes might be unexpectedly animated
- Working out the initial CSS state now uses `window.getComputedStyle()` to take into account any styling applied by external CSS stylesheets
- Fixed a bug that prevented the `webkitAnimationEnd` listener being removed as it was being accidentally defined in global scope
- Callback function now passes back the original element as a parameter
- Disabled the caching as it doesn't appear to be working 100% as expected

# v0.1.3 (2011/07/27)

- Added a cache to keep track of generated animations to reduce CPU usage for repeated transition effects
- Improved the efficiency of the setup loop

# v0.1.2 (2011/07/20)

- Added a callback to the config options as an alternative to listening for `webkitTransitionEnd`
- Updated Shifty.js to 0.4.1

# v0.1.1 (2011/07/15)

- Fixed binding issue with `webkitAnimationEnd` event
- Updated Shifty.js to 0.2.0

# v0.1 (2011/06/11)

- Initial Commit