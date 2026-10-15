/* Preserve fractional integration steps, including at very slow playback rates. */
(function(root) {
  'use strict';
  class PlaybackClock {
    constructor(dt=0.05) { this.dt=dt; this.reset(); }
    reset() { this.remainder=0; }
    steps(elapsedMs,speed) {
      this.remainder+=elapsedMs*speed;
      const count=Math.floor((this.remainder+1e-10)/this.dt);
      this.remainder=Math.max(0,this.remainder-count*this.dt);
      return count;
    }
  }
  if(typeof module!=='undefined') module.exports=PlaybackClock;
  root.PlaybackClock=PlaybackClock;
})(typeof window==='undefined'?globalThis:window);
