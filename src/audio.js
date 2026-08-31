export class AudioSystem{
  constructor(){this.ctx=null;this.muted=false}
  ensure(){if(!this.ctx)this.ctx=new (window.AudioContext||window.webkitAudioContext)(); if(this.ctx.state==="suspended")this.ctx.resume()}
  toggle(){this.muted=!this.muted}
  tone(freq=220,duration=.08,type="sine",gain=.05,slide=1){if(this.muted)return;this.ensure();const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*slide),t+duration);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.ctx.destination);o.start(t);o.stop(t+duration)}
  shot(){this.tone(540,.045,"square",.025,.7)}
  hit(){this.tone(120,.07,"sawtooth",.035,.45)}
  xp(){this.tone(880,.05,"sine",.02,1.35)}
  level(){this.tone(440,.18,"triangle",.04,2.2)}
  hurt(){this.tone(90,.12,"sawtooth",.05,.6)}
  boss(){this.tone(70,.5,"square",.05,1.6)}
  manifestation(freq=220){this.tone(freq,.46,"sawtooth",.032,1.8);this.tone(freq*1.5,.34,"triangle",.026,1.35);this.tone(freq*2,.22,"sine",.018,.92)}
}
