var L=Object.defineProperty;var M=(r,e,t)=>e in r?L(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var d=(r,e,t)=>M(r,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function t(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(n){if(n.ep)return;n.ep=!0;const s=t(n);fetch(n.href,s)}})();/**
 * lil-gui
 * https://lil-gui.georgealways.com
 * @version 0.21.0
 * @author George Michael Brower
 * @license MIT
 */class v{constructor(e,t,i,n,s="div"){this.parent=e,this.object=t,this.property=i,this._disabled=!1,this._hidden=!1,this.initialValue=this.getValue(),this.domElement=document.createElement(s),this.domElement.classList.add("lil-controller"),this.domElement.classList.add(n),this.$name=document.createElement("div"),this.$name.classList.add("lil-name"),v.nextNameID=v.nextNameID||0,this.$name.id=`lil-gui-name-${++v.nextNameID}`,this.$widget=document.createElement("div"),this.$widget.classList.add("lil-widget"),this.$disable=this.$widget,this.domElement.appendChild(this.$name),this.domElement.appendChild(this.$widget),this.domElement.addEventListener("keydown",o=>o.stopPropagation()),this.domElement.addEventListener("keyup",o=>o.stopPropagation()),this.parent.children.push(this),this.parent.controllers.push(this),this.parent.$children.appendChild(this.domElement),this._listenCallback=this._listenCallback.bind(this),this.name(i)}name(e){return this._name=e,this.$name.textContent=e,this}onChange(e){return this._onChange=e,this}_callOnChange(){this.parent._callOnChange(this),this._onChange!==void 0&&this._onChange.call(this,this.getValue()),this._changed=!0}onFinishChange(e){return this._onFinishChange=e,this}_callOnFinishChange(){this._changed&&(this.parent._callOnFinishChange(this),this._onFinishChange!==void 0&&this._onFinishChange.call(this,this.getValue())),this._changed=!1}reset(){return this.setValue(this.initialValue),this._callOnFinishChange(),this}enable(e=!0){return this.disable(!e)}disable(e=!0){return e===this._disabled?this:(this._disabled=e,this.domElement.classList.toggle("lil-disabled",e),this.$disable.toggleAttribute("disabled",e),this)}show(e=!0){return this._hidden=!e,this.domElement.style.display=this._hidden?"none":"",this}hide(){return this.show(!1)}options(e){const t=this.parent.add(this.object,this.property,e);return t.name(this._name),this.destroy(),t}min(e){return this}max(e){return this}step(e){return this}decimals(e){return this}listen(e=!0){return this._listening=e,this._listenCallbackID!==void 0&&(cancelAnimationFrame(this._listenCallbackID),this._listenCallbackID=void 0),this._listening&&this._listenCallback(),this}_listenCallback(){this._listenCallbackID=requestAnimationFrame(this._listenCallback);const e=this.save();e!==this._listenPrevValue&&this.updateDisplay(),this._listenPrevValue=e}getValue(){return this.object[this.property]}setValue(e){return this.getValue()!==e&&(this.object[this.property]=e,this._callOnChange(),this.updateDisplay()),this}updateDisplay(){return this}load(e){return this.setValue(e),this._callOnFinishChange(),this}save(){return this.getValue()}destroy(){this.listen(!1),this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.controllers.splice(this.parent.controllers.indexOf(this),1),this.parent.$children.removeChild(this.domElement)}}class F extends v{constructor(e,t,i){super(e,t,i,"lil-boolean","label"),this.$input=document.createElement("input"),this.$input.setAttribute("type","checkbox"),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$widget.appendChild(this.$input),this.$input.addEventListener("change",()=>{this.setValue(this.$input.checked),this._callOnFinishChange()}),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.checked=this.getValue(),this}}function C(r){let e,t;return(e=r.match(/(#|0x)?([a-f0-9]{6})/i))?t=e[2]:(e=r.match(/rgb\(\s*(\d*)\s*,\s*(\d*)\s*,\s*(\d*)\s*\)/))?t=parseInt(e[1]).toString(16).padStart(2,0)+parseInt(e[2]).toString(16).padStart(2,0)+parseInt(e[3]).toString(16).padStart(2,0):(e=r.match(/^#?([a-f0-9])([a-f0-9])([a-f0-9])$/i))&&(t=e[1]+e[1]+e[2]+e[2]+e[3]+e[3]),t?"#"+t:!1}const T={isPrimitive:!0,match:r=>typeof r=="string",fromHexString:C,toHexString:C},x={isPrimitive:!0,match:r=>typeof r=="number",fromHexString:r=>parseInt(r.substring(1),16),toHexString:r=>"#"+r.toString(16).padStart(6,0)},D={isPrimitive:!1,match:r=>Array.isArray(r)||ArrayBuffer.isView(r),fromHexString(r,e,t=1){const i=x.fromHexString(r);e[0]=(i>>16&255)/255*t,e[1]=(i>>8&255)/255*t,e[2]=(i&255)/255*t},toHexString([r,e,t],i=1){i=255/i;const n=r*i<<16^e*i<<8^t*i<<0;return x.toHexString(n)}},V={isPrimitive:!1,match:r=>Object(r)===r,fromHexString(r,e,t=1){const i=x.fromHexString(r);e.r=(i>>16&255)/255*t,e.g=(i>>8&255)/255*t,e.b=(i&255)/255*t},toHexString({r,g:e,b:t},i=1){i=255/i;const n=r*i<<16^e*i<<8^t*i<<0;return x.toHexString(n)}},B=[T,x,D,V];function O(r){return B.find(e=>e.match(r))}class P extends v{constructor(e,t,i,n){super(e,t,i,"lil-color"),this.$input=document.createElement("input"),this.$input.setAttribute("type","color"),this.$input.setAttribute("tabindex",-1),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$text=document.createElement("input"),this.$text.setAttribute("type","text"),this.$text.setAttribute("spellcheck","false"),this.$text.setAttribute("aria-labelledby",this.$name.id),this.$display=document.createElement("div"),this.$display.classList.add("lil-display"),this.$display.appendChild(this.$input),this.$widget.appendChild(this.$display),this.$widget.appendChild(this.$text),this._format=O(this.initialValue),this._rgbScale=n,this._initialValueHexString=this.save(),this._textFocused=!1,this.$input.addEventListener("input",()=>{this._setValueFromHexString(this.$input.value)}),this.$input.addEventListener("blur",()=>{this._callOnFinishChange()}),this.$text.addEventListener("input",()=>{const s=C(this.$text.value);s&&this._setValueFromHexString(s)}),this.$text.addEventListener("focus",()=>{this._textFocused=!0,this.$text.select()}),this.$text.addEventListener("blur",()=>{this._textFocused=!1,this.updateDisplay(),this._callOnFinishChange()}),this.$disable=this.$text,this.updateDisplay()}reset(){return this._setValueFromHexString(this._initialValueHexString),this}_setValueFromHexString(e){if(this._format.isPrimitive){const t=this._format.fromHexString(e);this.setValue(t)}else this._format.fromHexString(e,this.getValue(),this._rgbScale),this._callOnChange(),this.updateDisplay()}save(){return this._format.toHexString(this.getValue(),this._rgbScale)}load(e){return this._setValueFromHexString(e),this._callOnFinishChange(),this}updateDisplay(){return this.$input.value=this._format.toHexString(this.getValue(),this._rgbScale),this._textFocused||(this.$text.value=this.$input.value.substring(1)),this.$display.style.backgroundColor=this.$input.value,this}}class S extends v{constructor(e,t,i){super(e,t,i,"lil-function"),this.$button=document.createElement("button"),this.$button.appendChild(this.$name),this.$widget.appendChild(this.$button),this.$button.addEventListener("click",n=>{n.preventDefault(),this.getValue().call(this.object),this._callOnChange()}),this.$button.addEventListener("touchstart",()=>{},{passive:!0}),this.$disable=this.$button}}class U extends v{constructor(e,t,i,n,s,o){super(e,t,i,"lil-number"),this._initInput(),this.min(n),this.max(s);const h=o!==void 0;this.step(h?o:this._getImplicitStep(),h),this.updateDisplay()}decimals(e){return this._decimals=e,this.updateDisplay(),this}min(e){return this._min=e,this._onUpdateMinMax(),this}max(e){return this._max=e,this._onUpdateMinMax(),this}step(e,t=!0){return this._step=e,this._stepExplicit=t,this}updateDisplay(){const e=this.getValue();if(this._hasSlider){let t=(e-this._min)/(this._max-this._min);t=Math.max(0,Math.min(t,1)),this.$fill.style.width=t*100+"%"}return this._inputFocused||(this.$input.value=this._decimals===void 0?e:e.toFixed(this._decimals)),this}_initInput(){this.$input=document.createElement("input"),this.$input.setAttribute("type","text"),this.$input.setAttribute("aria-labelledby",this.$name.id),window.matchMedia("(pointer: coarse)").matches&&(this.$input.setAttribute("type","number"),this.$input.setAttribute("step","any")),this.$widget.appendChild(this.$input),this.$disable=this.$input;const t=()=>{let l=parseFloat(this.$input.value);isNaN(l)||(this._stepExplicit&&(l=this._snap(l)),this.setValue(this._clamp(l)))},i=l=>{const c=parseFloat(this.$input.value);isNaN(c)||(this._snapClampSetValue(c+l),this.$input.value=this.getValue())},n=l=>{l.key==="Enter"&&this.$input.blur(),l.code==="ArrowUp"&&(l.preventDefault(),i(this._step*this._arrowKeyMultiplier(l))),l.code==="ArrowDown"&&(l.preventDefault(),i(this._step*this._arrowKeyMultiplier(l)*-1))},s=l=>{this._inputFocused&&(l.preventDefault(),i(this._step*this._normalizeMouseWheel(l)))};let o=!1,h,g,m,p,u;const b=5,w=l=>{h=l.clientX,g=m=l.clientY,o=!0,p=this.getValue(),u=0,window.addEventListener("mousemove",y),window.addEventListener("mouseup",f)},y=l=>{if(o){const c=l.clientX-h,_=l.clientY-g;Math.abs(_)>b?(l.preventDefault(),this.$input.blur(),o=!1,this._setDraggingStyle(!0,"vertical")):Math.abs(c)>b&&f()}if(!o){const c=l.clientY-m;u-=c*this._step*this._arrowKeyMultiplier(l),p+u>this._max?u=this._max-p:p+u<this._min&&(u=this._min-p),this._snapClampSetValue(p+u)}m=l.clientY},f=()=>{this._setDraggingStyle(!1,"vertical"),this._callOnFinishChange(),window.removeEventListener("mousemove",y),window.removeEventListener("mouseup",f)},E=()=>{this._inputFocused=!0},a=()=>{this._inputFocused=!1,this.updateDisplay(),this._callOnFinishChange()};this.$input.addEventListener("input",t),this.$input.addEventListener("keydown",n),this.$input.addEventListener("wheel",s,{passive:!1}),this.$input.addEventListener("mousedown",w),this.$input.addEventListener("focus",E),this.$input.addEventListener("blur",a)}_initSlider(){this._hasSlider=!0,this.$slider=document.createElement("div"),this.$slider.classList.add("lil-slider"),this.$fill=document.createElement("div"),this.$fill.classList.add("lil-fill"),this.$slider.appendChild(this.$fill),this.$widget.insertBefore(this.$slider,this.$input),this.domElement.classList.add("lil-has-slider");const e=(a,l,c,_,A)=>(a-l)/(c-l)*(A-_)+_,t=a=>{const l=this.$slider.getBoundingClientRect();let c=e(a,l.left,l.right,this._min,this._max);this._snapClampSetValue(c)},i=a=>{this._setDraggingStyle(!0),t(a.clientX),window.addEventListener("mousemove",n),window.addEventListener("mouseup",s)},n=a=>{t(a.clientX)},s=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener("mousemove",n),window.removeEventListener("mouseup",s)};let o=!1,h,g;const m=a=>{a.preventDefault(),this._setDraggingStyle(!0),t(a.touches[0].clientX),o=!1},p=a=>{a.touches.length>1||(this._hasScrollBar?(h=a.touches[0].clientX,g=a.touches[0].clientY,o=!0):m(a),window.addEventListener("touchmove",u,{passive:!1}),window.addEventListener("touchend",b))},u=a=>{if(o){const l=a.touches[0].clientX-h,c=a.touches[0].clientY-g;Math.abs(l)>Math.abs(c)?m(a):(window.removeEventListener("touchmove",u),window.removeEventListener("touchend",b))}else a.preventDefault(),t(a.touches[0].clientX)},b=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener("touchmove",u),window.removeEventListener("touchend",b)},w=this._callOnFinishChange.bind(this),y=400;let f;const E=a=>{if(Math.abs(a.deltaX)<Math.abs(a.deltaY)&&this._hasScrollBar)return;a.preventDefault();const c=this._normalizeMouseWheel(a)*this._step;this._snapClampSetValue(this.getValue()+c),this.$input.value=this.getValue(),clearTimeout(f),f=setTimeout(w,y)};this.$slider.addEventListener("mousedown",i),this.$slider.addEventListener("touchstart",p,{passive:!1}),this.$slider.addEventListener("wheel",E,{passive:!1})}_setDraggingStyle(e,t="horizontal"){this.$slider&&this.$slider.classList.toggle("lil-active",e),document.body.classList.toggle("lil-dragging",e),document.body.classList.toggle(`lil-${t}`,e)}_getImplicitStep(){return this._hasMin&&this._hasMax?(this._max-this._min)/1e3:.1}_onUpdateMinMax(){!this._hasSlider&&this._hasMin&&this._hasMax&&(this._stepExplicit||this.step(this._getImplicitStep(),!1),this._initSlider(),this.updateDisplay())}_normalizeMouseWheel(e){let{deltaX:t,deltaY:i}=e;return Math.floor(e.deltaY)!==e.deltaY&&e.wheelDelta&&(t=0,i=-e.wheelDelta/120,i*=this._stepExplicit?1:10),t+-i}_arrowKeyMultiplier(e){let t=this._stepExplicit?1:10;return e.shiftKey?t*=10:e.altKey&&(t/=10),t}_snap(e){let t=0;return this._hasMin?t=this._min:this._hasMax&&(t=this._max),e-=t,e=Math.round(e/this._step)*this._step,e+=t,e=parseFloat(e.toPrecision(15)),e}_clamp(e){return e<this._min&&(e=this._min),e>this._max&&(e=this._max),e}_snapClampSetValue(e){this.setValue(this._clamp(this._snap(e)))}get _hasScrollBar(){const e=this.parent.root.$children;return e.scrollHeight>e.clientHeight}get _hasMin(){return this._min!==void 0}get _hasMax(){return this._max!==void 0}}class I extends v{constructor(e,t,i,n){super(e,t,i,"lil-option"),this.$select=document.createElement("select"),this.$select.setAttribute("aria-labelledby",this.$name.id),this.$display=document.createElement("div"),this.$display.classList.add("lil-display"),this.$select.addEventListener("change",()=>{this.setValue(this._values[this.$select.selectedIndex]),this._callOnFinishChange()}),this.$select.addEventListener("focus",()=>{this.$display.classList.add("lil-focus")}),this.$select.addEventListener("blur",()=>{this.$display.classList.remove("lil-focus")}),this.$widget.appendChild(this.$select),this.$widget.appendChild(this.$display),this.$disable=this.$select,this.options(n)}options(e){return this._values=Array.isArray(e)?e:Object.values(e),this._names=Array.isArray(e)?e:Object.keys(e),this.$select.replaceChildren(),this._names.forEach(t=>{const i=document.createElement("option");i.textContent=t,this.$select.appendChild(i)}),this.updateDisplay(),this}updateDisplay(){const e=this.getValue(),t=this._values.indexOf(e);return this.$select.selectedIndex=t,this.$display.textContent=t===-1?e:this._names[t],this}}class z extends v{constructor(e,t,i){super(e,t,i,"lil-string"),this.$input=document.createElement("input"),this.$input.setAttribute("type","text"),this.$input.setAttribute("spellcheck","false"),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$input.addEventListener("input",()=>{this.setValue(this.$input.value)}),this.$input.addEventListener("keydown",n=>{n.code==="Enter"&&this.$input.blur()}),this.$input.addEventListener("blur",()=>{this._callOnFinishChange()}),this.$widget.appendChild(this.$input),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.value=this.getValue(),this}}var R=`.lil-gui {
  font-family: var(--font-family);
  font-size: var(--font-size);
  line-height: 1;
  font-weight: normal;
  font-style: normal;
  text-align: left;
  color: var(--text-color);
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  --background-color: #1f1f1f;
  --text-color: #ebebeb;
  --title-background-color: #111111;
  --title-text-color: #ebebeb;
  --widget-color: #424242;
  --hover-color: #4f4f4f;
  --focus-color: #595959;
  --number-color: #2cc9ff;
  --string-color: #a2db3c;
  --font-size: 11px;
  --input-font-size: 11px;
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  --font-family-mono: Menlo, Monaco, Consolas, "Droid Sans Mono", monospace;
  --padding: 4px;
  --spacing: 4px;
  --widget-height: 20px;
  --title-height: calc(var(--widget-height) + var(--spacing) * 1.25);
  --name-width: 45%;
  --slider-knob-width: 2px;
  --slider-input-width: 27%;
  --color-input-width: 27%;
  --slider-input-min-width: 45px;
  --color-input-min-width: 45px;
  --folder-indent: 7px;
  --widget-padding: 0 0 0 3px;
  --widget-border-radius: 2px;
  --checkbox-size: calc(0.75 * var(--widget-height));
  --scrollbar-width: 5px;
}
.lil-gui, .lil-gui * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.lil-gui.lil-root {
  width: var(--width, 245px);
  display: flex;
  flex-direction: column;
  background: var(--background-color);
}
.lil-gui.lil-root > .lil-title {
  background: var(--title-background-color);
  color: var(--title-text-color);
}
.lil-gui.lil-root > .lil-children {
  overflow-x: hidden;
  overflow-y: auto;
}
.lil-gui.lil-root > .lil-children::-webkit-scrollbar {
  width: var(--scrollbar-width);
  height: var(--scrollbar-width);
  background: var(--background-color);
}
.lil-gui.lil-root > .lil-children::-webkit-scrollbar-thumb {
  border-radius: var(--scrollbar-width);
  background: var(--focus-color);
}
@media (pointer: coarse) {
  .lil-gui.lil-allow-touch-styles, .lil-gui.lil-allow-touch-styles .lil-gui {
    --widget-height: 28px;
    --padding: 6px;
    --spacing: 6px;
    --font-size: 13px;
    --input-font-size: 16px;
    --folder-indent: 10px;
    --scrollbar-width: 7px;
    --slider-input-min-width: 50px;
    --color-input-min-width: 65px;
  }
}
.lil-gui.lil-force-touch-styles, .lil-gui.lil-force-touch-styles .lil-gui {
  --widget-height: 28px;
  --padding: 6px;
  --spacing: 6px;
  --font-size: 13px;
  --input-font-size: 16px;
  --folder-indent: 10px;
  --scrollbar-width: 7px;
  --slider-input-min-width: 50px;
  --color-input-min-width: 65px;
}
.lil-gui.lil-auto-place, .lil-gui.autoPlace {
  max-height: 100%;
  position: fixed;
  top: 0;
  right: 15px;
  z-index: 1001;
}

.lil-controller {
  display: flex;
  align-items: center;
  padding: 0 var(--padding);
  margin: var(--spacing) 0;
}
.lil-controller.lil-disabled {
  opacity: 0.5;
}
.lil-controller.lil-disabled, .lil-controller.lil-disabled * {
  pointer-events: none !important;
}
.lil-controller > .lil-name {
  min-width: var(--name-width);
  flex-shrink: 0;
  white-space: pre;
  padding-right: var(--spacing);
  line-height: var(--widget-height);
}
.lil-controller .lil-widget {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--widget-height);
}
.lil-controller.lil-string input {
  color: var(--string-color);
}
.lil-controller.lil-boolean {
  cursor: pointer;
}
.lil-controller.lil-color .lil-display {
  width: 100%;
  height: var(--widget-height);
  border-radius: var(--widget-border-radius);
  position: relative;
}
@media (hover: hover) {
  .lil-controller.lil-color .lil-display:hover:before {
    content: " ";
    display: block;
    position: absolute;
    border-radius: var(--widget-border-radius);
    border: 1px solid #fff9;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
}
.lil-controller.lil-color input[type=color] {
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.lil-controller.lil-color input[type=text] {
  margin-left: var(--spacing);
  font-family: var(--font-family-mono);
  min-width: var(--color-input-min-width);
  width: var(--color-input-width);
  flex-shrink: 0;
}
.lil-controller.lil-option select {
  opacity: 0;
  position: absolute;
  width: 100%;
  max-width: 100%;
}
.lil-controller.lil-option .lil-display {
  position: relative;
  pointer-events: none;
  border-radius: var(--widget-border-radius);
  height: var(--widget-height);
  line-height: var(--widget-height);
  max-width: 100%;
  overflow: hidden;
  word-break: break-all;
  padding-left: 0.55em;
  padding-right: 1.75em;
  background: var(--widget-color);
}
@media (hover: hover) {
  .lil-controller.lil-option .lil-display.lil-focus {
    background: var(--focus-color);
  }
}
.lil-controller.lil-option .lil-display.lil-active {
  background: var(--focus-color);
}
.lil-controller.lil-option .lil-display:after {
  font-family: "lil-gui";
  content: "↕";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  padding-right: 0.375em;
}
.lil-controller.lil-option .lil-widget,
.lil-controller.lil-option select {
  cursor: pointer;
}
@media (hover: hover) {
  .lil-controller.lil-option .lil-widget:hover .lil-display {
    background: var(--hover-color);
  }
}
.lil-controller.lil-number input {
  color: var(--number-color);
}
.lil-controller.lil-number.lil-has-slider input {
  margin-left: var(--spacing);
  width: var(--slider-input-width);
  min-width: var(--slider-input-min-width);
  flex-shrink: 0;
}
.lil-controller.lil-number .lil-slider {
  width: 100%;
  height: var(--widget-height);
  background: var(--widget-color);
  border-radius: var(--widget-border-radius);
  padding-right: var(--slider-knob-width);
  overflow: hidden;
  cursor: ew-resize;
  touch-action: pan-y;
}
@media (hover: hover) {
  .lil-controller.lil-number .lil-slider:hover {
    background: var(--hover-color);
  }
}
.lil-controller.lil-number .lil-slider.lil-active {
  background: var(--focus-color);
}
.lil-controller.lil-number .lil-slider.lil-active .lil-fill {
  opacity: 0.95;
}
.lil-controller.lil-number .lil-fill {
  height: 100%;
  border-right: var(--slider-knob-width) solid var(--number-color);
  box-sizing: content-box;
}

.lil-dragging .lil-gui {
  --hover-color: var(--widget-color);
}
.lil-dragging * {
  cursor: ew-resize !important;
}
.lil-dragging.lil-vertical * {
  cursor: ns-resize !important;
}

.lil-gui .lil-title {
  height: var(--title-height);
  font-weight: 600;
  padding: 0 var(--padding);
  width: 100%;
  text-align: left;
  background: none;
  text-decoration-skip: objects;
}
.lil-gui .lil-title:before {
  font-family: "lil-gui";
  content: "▾";
  padding-right: 2px;
  display: inline-block;
}
.lil-gui .lil-title:active {
  background: var(--title-background-color);
  opacity: 0.75;
}
@media (hover: hover) {
  body:not(.lil-dragging) .lil-gui .lil-title:hover {
    background: var(--title-background-color);
    opacity: 0.85;
  }
  .lil-gui .lil-title:focus {
    text-decoration: underline var(--focus-color);
  }
}
.lil-gui.lil-root > .lil-title:focus {
  text-decoration: none !important;
}
.lil-gui.lil-closed > .lil-title:before {
  content: "▸";
}
.lil-gui.lil-closed > .lil-children {
  transform: translateY(-7px);
  opacity: 0;
}
.lil-gui.lil-closed:not(.lil-transition) > .lil-children {
  display: none;
}
.lil-gui.lil-transition > .lil-children {
  transition-duration: 300ms;
  transition-property: height, opacity, transform;
  transition-timing-function: cubic-bezier(0.2, 0.6, 0.35, 1);
  overflow: hidden;
  pointer-events: none;
}
.lil-gui .lil-children:empty:before {
  content: "Empty";
  padding: 0 var(--padding);
  margin: var(--spacing) 0;
  display: block;
  height: var(--widget-height);
  font-style: italic;
  line-height: var(--widget-height);
  opacity: 0.5;
}
.lil-gui.lil-root > .lil-children > .lil-gui > .lil-title {
  border: 0 solid var(--widget-color);
  border-width: 1px 0;
  transition: border-color 300ms;
}
.lil-gui.lil-root > .lil-children > .lil-gui.lil-closed > .lil-title {
  border-bottom-color: transparent;
}
.lil-gui + .lil-controller {
  border-top: 1px solid var(--widget-color);
  margin-top: 0;
  padding-top: var(--spacing);
}
.lil-gui .lil-gui .lil-gui > .lil-title {
  border: none;
}
.lil-gui .lil-gui .lil-gui > .lil-children {
  border: none;
  margin-left: var(--folder-indent);
  border-left: 2px solid var(--widget-color);
}
.lil-gui .lil-gui .lil-controller {
  border: none;
}

.lil-gui label, .lil-gui input, .lil-gui button {
  -webkit-tap-highlight-color: transparent;
}
.lil-gui input {
  border: 0;
  outline: none;
  font-family: var(--font-family);
  font-size: var(--input-font-size);
  border-radius: var(--widget-border-radius);
  height: var(--widget-height);
  background: var(--widget-color);
  color: var(--text-color);
  width: 100%;
}
@media (hover: hover) {
  .lil-gui input:hover {
    background: var(--hover-color);
  }
  .lil-gui input:active {
    background: var(--focus-color);
  }
}
.lil-gui input:disabled {
  opacity: 1;
}
.lil-gui input[type=text],
.lil-gui input[type=number] {
  padding: var(--widget-padding);
  -moz-appearance: textfield;
}
.lil-gui input[type=text]:focus,
.lil-gui input[type=number]:focus {
  background: var(--focus-color);
}
.lil-gui input[type=checkbox] {
  appearance: none;
  width: var(--checkbox-size);
  height: var(--checkbox-size);
  border-radius: var(--widget-border-radius);
  text-align: center;
  cursor: pointer;
}
.lil-gui input[type=checkbox]:checked:before {
  font-family: "lil-gui";
  content: "✓";
  font-size: var(--checkbox-size);
  line-height: var(--checkbox-size);
}
@media (hover: hover) {
  .lil-gui input[type=checkbox]:focus {
    box-shadow: inset 0 0 0 1px var(--focus-color);
  }
}
.lil-gui button {
  outline: none;
  cursor: pointer;
  font-family: var(--font-family);
  font-size: var(--font-size);
  color: var(--text-color);
  width: 100%;
  border: none;
}
.lil-gui .lil-controller button {
  height: var(--widget-height);
  text-transform: none;
  background: var(--widget-color);
  border-radius: var(--widget-border-radius);
}
@media (hover: hover) {
  .lil-gui .lil-controller button:hover {
    background: var(--hover-color);
  }
  .lil-gui .lil-controller button:focus {
    box-shadow: inset 0 0 0 1px var(--focus-color);
  }
}
.lil-gui .lil-controller button:active {
  background: var(--focus-color);
}

@font-face {
  font-family: "lil-gui";
  src: url("data:application/font-woff2;charset=utf-8;base64,d09GMgABAAAAAALkAAsAAAAABtQAAAKVAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHFQGYACDMgqBBIEbATYCJAMUCwwABCAFhAoHgQQbHAbIDiUFEYVARAAAYQTVWNmz9MxhEgodq49wYRUFKE8GWNiUBxI2LBRaVnc51U83Gmhs0Q7JXWMiz5eteLwrKwuxHO8VFxUX9UpZBs6pa5ABRwHA+t3UxUnH20EvVknRerzQgX6xC/GH6ZUvTcAjAv122dF28OTqCXrPuyaDER30YBA1xnkVutDDo4oCi71Ca7rrV9xS8dZHbPHefsuwIyCpmT7j+MnjAH5X3984UZoFFuJ0yiZ4XEJFxjagEBeqs+e1iyK8Xf/nOuwF+vVK0ur765+vf7txotUi0m3N0m/84RGSrBCNrh8Ee5GjODjF4gnWP+dJrH/Lk9k4oT6d+gr6g/wssA2j64JJGP6cmx554vUZnpZfn6ZfX2bMwPPrlANsB86/DiHjhl0OP+c87+gaJo/gY084s3HoYL/ZkWHTRfBXvvoHnnkHvngKun4KBE/ede7tvq3/vQOxDXB1/fdNz6XbPdcr0Vhpojj9dG+owuSKFsslCi1tgEjirjXdwMiov2EioadxmqTHUCIwo8NgQaeIasAi0fTYSPTbSmwbMOFduyh9wvBrESGY0MtgRjtgQR8Q1bRPohn2UoCRZf9wyYANMXFeJTysqAe0I4mrherOekFdKMrYvJjLvOIUM9SuwYB5DVZUwwVjJJOaUnZCmcEkIZZrKqNvRGRMvmFZsmhP4VMKCSXBhSqUBxgMS7h0cZvEd71AWkEhGWaeMFcNnpqyJkyXgYL7PQ1MoSq0wDAkRtJIijkZSmqYTiSImfLiSWXIZwhRh3Rug2X0kk1Dgj+Iu43u5p98ghopcpSo0Uyc8SnjlYX59WUeaMoDqmVD2TOWD9a4pCRAzf2ECgwGcrHjPOWY9bNxq/OL3I/QjwEAAAA=") format("woff2");
}`;function H(r){const e=document.createElement("style");e.innerHTML=r;const t=document.querySelector("head link[rel=stylesheet], head style");t?document.head.insertBefore(e,t):document.head.appendChild(e)}let $=!1;class k{constructor({parent:e,autoPlace:t=e===void 0,container:i,width:n,title:s="Controls",closeFolders:o=!1,injectStyles:h=!0,touchStyles:g=!0}={}){if(this.parent=e,this.root=e?e.root:this,this.children=[],this.controllers=[],this.folders=[],this._closed=!1,this._hidden=!1,this.domElement=document.createElement("div"),this.domElement.classList.add("lil-gui"),this.$title=document.createElement("button"),this.$title.classList.add("lil-title"),this.$title.setAttribute("aria-expanded",!0),this.$title.addEventListener("click",()=>this.openAnimated(this._closed)),this.$title.addEventListener("touchstart",()=>{},{passive:!0}),this.$children=document.createElement("div"),this.$children.classList.add("lil-children"),this.domElement.appendChild(this.$title),this.domElement.appendChild(this.$children),this.title(s),this.parent){this.parent.children.push(this),this.parent.folders.push(this),this.parent.$children.appendChild(this.domElement);return}this.domElement.classList.add("lil-root"),g&&this.domElement.classList.add("lil-allow-touch-styles"),!$&&h&&(H(R),$=!0),i?i.appendChild(this.domElement):t&&(this.domElement.classList.add("lil-auto-place","autoPlace"),document.body.appendChild(this.domElement)),n&&this.domElement.style.setProperty("--width",n+"px"),this._closeFolders=o}add(e,t,i,n,s){if(Object(i)===i)return new I(this,e,t,i);const o=e[t];switch(typeof o){case"number":return new U(this,e,t,i,n,s);case"boolean":return new F(this,e,t);case"string":return new z(this,e,t);case"function":return new S(this,e,t)}console.error(`gui.add failed
	property:`,t,`
	object:`,e,`
	value:`,o)}addColor(e,t,i=1){return new P(this,e,t,i)}addFolder(e){const t=new k({parent:this,title:e});return this.root._closeFolders&&t.close(),t}load(e,t=!0){return e.controllers&&this.controllers.forEach(i=>{i instanceof S||i._name in e.controllers&&i.load(e.controllers[i._name])}),t&&e.folders&&this.folders.forEach(i=>{i._title in e.folders&&i.load(e.folders[i._title])}),this}save(e=!0){const t={controllers:{},folders:{}};return this.controllers.forEach(i=>{if(!(i instanceof S)){if(i._name in t.controllers)throw new Error(`Cannot save GUI with duplicate property "${i._name}"`);t.controllers[i._name]=i.save()}}),e&&this.folders.forEach(i=>{if(i._title in t.folders)throw new Error(`Cannot save GUI with duplicate folder "${i._title}"`);t.folders[i._title]=i.save()}),t}open(e=!0){return this._setClosed(!e),this.$title.setAttribute("aria-expanded",!this._closed),this.domElement.classList.toggle("lil-closed",this._closed),this}close(){return this.open(!1)}_setClosed(e){this._closed!==e&&(this._closed=e,this._callOnOpenClose(this))}show(e=!0){return this._hidden=!e,this.domElement.style.display=this._hidden?"none":"",this}hide(){return this.show(!1)}openAnimated(e=!0){return this._setClosed(!e),this.$title.setAttribute("aria-expanded",!this._closed),requestAnimationFrame(()=>{const t=this.$children.clientHeight;this.$children.style.height=t+"px",this.domElement.classList.add("lil-transition");const i=s=>{s.target===this.$children&&(this.$children.style.height="",this.domElement.classList.remove("lil-transition"),this.$children.removeEventListener("transitionend",i))};this.$children.addEventListener("transitionend",i);const n=e?this.$children.scrollHeight:0;this.domElement.classList.toggle("lil-closed",!e),requestAnimationFrame(()=>{this.$children.style.height=n+"px"})}),this}title(e){return this._title=e,this.$title.textContent=e,this}reset(e=!0){return(e?this.controllersRecursive():this.controllers).forEach(i=>i.reset()),this}onChange(e){return this._onChange=e,this}_callOnChange(e){this.parent&&this.parent._callOnChange(e),this._onChange!==void 0&&this._onChange.call(this,{object:e.object,property:e.property,value:e.getValue(),controller:e})}onFinishChange(e){return this._onFinishChange=e,this}_callOnFinishChange(e){this.parent&&this.parent._callOnFinishChange(e),this._onFinishChange!==void 0&&this._onFinishChange.call(this,{object:e.object,property:e.property,value:e.getValue(),controller:e})}onOpenClose(e){return this._onOpenClose=e,this}_callOnOpenClose(e){this.parent&&this.parent._callOnOpenClose(e),this._onOpenClose!==void 0&&this._onOpenClose.call(this,e)}destroy(){this.parent&&(this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.folders.splice(this.parent.folders.indexOf(this),1)),this.domElement.parentElement&&this.domElement.parentElement.removeChild(this.domElement),Array.from(this.children).forEach(e=>e.destroy())}controllersRecursive(){let e=Array.from(this.controllers);return this.folders.forEach(t=>{e=e.concat(t.controllersRecursive())}),e}foldersRecursive(){let e=Array.from(this.folders);return this.folders.forEach(t=>{e=e.concat(t.foldersRecursive())}),e}}const G=`// Based on "Heartfelt" by Martijn Steinrucken aka BigWings
// https://www.shadertoy.com/view/ltffzl
//
// RAINDROP EFFECT OVERVIEW
// ========================
// This shader simulates raindrops on a glass window. The effect combines:
// 1. A grid-based system where each cell contains one raindrop
// 2. Multiple layers at different scales for depth
// 3. Static small droplets that appear and fade
// 4. Refraction to distort the background through each drop
// 5. Rim lighting and specular highlights for 3D appearance
//
// The key insight is that raindrops on glass don't fall smoothly - they
// stick due to surface tension, accumulate water, then suddenly slide
// down. This "stop and go" motion is achieved using a sawtooth function.

struct Uniforms {
  time: f32,
  width: f32,
  height: f32,
  rainAmount: f32,
  dropSpeed: f32,
  sawProbability: f32,
  dropSize: f32,
  minBlur: f32,
  maxBlur: f32,
  refractionStrength: f32,
  rimLightIntensity: f32,
  specularIntensity: f32,
  specularPower: f32,
  lightningEnabled: f32,
  lightningIntensity: f32,
  useTextureBackground: f32,
  randomSeed: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var bgSampler: sampler;
@group(0) @binding(2) var bgTexture: texture_2d<f32>;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

@vertex
fn vertexMain(
  @location(0) pos: vec2<f32>,
  @location(1) uv: vec2<f32>
) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4<f32>(pos, 0.0, 1.0);
  output.uv = uv;
  return output;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Shorthand for smoothstep - used extensively for soft thresholds
fn S(a: f32, b: f32, t: f32) -> f32 {
  return smoothstep(a, b, t);
}

// Hash function: converts a single float into 3 pseudo-random values (0-1)
// Used to give each grid cell unique random properties (position, size, timing)
fn N13(p: f32) -> vec3<f32> {
  var p3 = fract(vec3<f32>(p) * vec3<f32>(0.1031, 0.11369, 0.13787));
  p3 = p3 + dot(p3, p3.yzx + 19.19);
  return fract(vec3<f32>((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y, (p3.y + p3.z) * p3.x));
}

// Simple 1D hash function
fn N(t: f32) -> f32 {
  return fract(sin(t * 12345.564) * 7658.76);
}

// Sawtooth function: creates the "stick then slide" motion of raindrops
// Returns 0 at t=0, rises to 1 at t=b, then falls back to 0 at t=1
// The steep rise followed by gradual fall mimics how drops suddenly release
// and slide down the glass before slowing and sticking again
fn Saw(b: f32, t: f32) -> f32 {
  return S(0.0, b, t) * S(1.0, b, t);
}

// =============================================================================
// RAINDROP LAYERS
// =============================================================================

// DropLayer2: Creates a layer of falling raindrops
// Returns vec2(dropMask, trailMask) where:
//   - dropMask: intensity of the main drop (used for refraction)
//   - trailMask: intensity of the trail behind the drop (used for blur)
fn DropLayer2(uv: vec2<f32>, t: f32) -> vec2<f32> {
  let UV = uv;

  // Scroll the UV coordinates downward over time to simulate falling rain
  var uvMod = uv;
  uvMod.y = uvMod.y + t * uniforms.dropSpeed;

  // Create a grid of cells - each cell will contain one raindrop
  // The grid is 12x2 (wider than tall) because drops are vertically elongated
  let a = vec2<f32>(6.0, 1.0);
  let grid = a * 2.0;

  // Shift each column by a random amount so drops don't align horizontally
  var id = floor(uvMod * grid);
  let colShift = N(id.x);
  uvMod.y = uvMod.y + colShift;

  // Get the cell ID and generate random values for this cell
  id = floor(uvMod * grid);
  let n = N13(id.x * 35.2 + id.y * 2376.1);

  // st is the position within the current cell, centered at (0, 0)
  var st = fract(uvMod * grid) - vec2<f32>(0.5, 0.0);

  // Horizontal position: random offset with a slight wiggle based on Y
  // This makes drops wobble side-to-side as they fall, like real water
  var x = n.x - 0.5;
  var y = UV.y * 20.0;
  let wiggle = sin(y + sin(y));
  x = x + wiggle * (0.5 - abs(x)) * (n.z - 0.5);
  x = x * 0.7;

  // Vertical animation: some drops use sawtooth (stick-slide motion),
  // others fall more linearly at varying speeds
  let scaledT = t * uniforms.dropSpeed / 0.75;
  let ti = fract(scaledT + n.z);  // Phase offset per drop
  let useSaw = n.y > uniforms.sawProbability;
  let speed = 0.5 + n.x * 1.0;
  if (useSaw) {
    // Sawtooth: drop sticks (slow rise) then suddenly slides (fast fall)
    y = (Saw(0.85, ti) - 0.5) * 0.9 + 0.5;
  } else {
    // Linear fall with random speed variation
    y = fract(ti * speed) * 0.9 + 0.05;
  }

  // Calculate distance from current pixel to drop center
  // Multiply by a.yx to account for the non-square grid cells
  let p = vec2<f32>(x, y);
  let d = length((st - p) * a.yx);

  // Main drop: circular with soft edges
  let mainDrop = S(0.4, 0.0, d);

  // Trail: the wet streak left behind as the drop slides down
  // r decreases as we get closer to the drop (trail fades near the drop)
  let r = sqrt(S(1.0, y, st.y));
  let cd = abs(st.x - x);  // Horizontal distance from drop center
  var trail = S(0.23 * r, 0.15 * r * r, cd);
  let trailFront = S(-0.02, 0.02, st.y - y);  // Only show trail above the drop
  trail = trail * trailFront * r * r;

  // Small droplets in the trail: tiny beads of water left behind
  var y2 = UV.y;
  var trail2 = S(0.2 * r, 0.0, cd);
  var droplets = max(0.0, sin(y2 * (1.0 - y2) * 120.0) - st.y) * trail2 * trailFront * n.z;
  y2 = fract(y2 * 10.0) + (st.y - 0.5);
  let dd = length(st - vec2<f32>(x, y2));
  droplets = S(0.3, 0.0, dd);

  // Combine main drop with trail droplets
  let m = mainDrop + droplets * r * trailFront;

  return vec2<f32>(m, trail);
}

// StaticDrops: Small droplets that stick to the glass and slowly fade
// These represent condensation or mist rather than falling rain
fn StaticDrops(uv: vec2<f32>, t: f32) -> f32 {
  // Finer grid (40x40) for many small droplets
  var uvMod = uv * 40.0;

  let id = floor(uvMod);
  uvMod = fract(uvMod) - 0.5;

  // Random position and timing for each droplet
  let n = N13(id.x * 107.45 + id.y * 3543.654);
  let p = (n.xy - 0.5) * 0.7;
  let d = length(uvMod - p);

  // Droplets fade in and out using sawtooth for organic appearance
  let fade = Saw(0.025, fract(t + n.z));
  let c = S(0.3, 0.0, d) * fract(n.z * 10.0) * fade;

  return c;
}

// Drops: Combines all drop layers with controllable intensity
// l0: static drops intensity
// l1: main falling layer intensity
// l2: secondary falling layer (smaller scale) intensity
fn Drops(uv: vec2<f32>, t: f32, l0: f32, l1: f32, l2: f32) -> vec2<f32> {
  let s = StaticDrops(uv, t) * l0;
  let m1 = DropLayer2(uv, t) * l1;
  // Second layer at 1.85x scale adds depth - drops appear at different distances
  let m2 = DropLayer2(uv * 1.85, t) * l2;

  // Combine all drop masks
  var c = s + m1.x + m2.x;
  c = S(0.3, 1.0, c);  // Threshold to sharpen edges

  // Return combined mask and max trail intensity
  return vec2<f32>(c, max(m1.y * l0, m2.y * l1));
}

// =============================================================================
// BACKGROUND RENDERING
// =============================================================================

// Procedural bokeh background: simulates out-of-focus city lights at night
fn ProceduralBackground(uv: vec2<f32>, blur: f32) -> vec3<f32> {
  let aspect = uniforms.width / uniforms.height;
  var coord = vec2<f32>((uv.x - 0.5) * aspect, uv.y - 0.5);

  // Dark purple gradient for night sky
  var color = mix(
    vec3<f32>(0.08, 0.06, 0.12),
    vec3<f32>(0.15, 0.12, 0.18),
    uv.y
  );

  // Bokeh circles grow larger with more blur (like real out-of-focus lights)
  let blurFactor = blur / 6.0;
  let bokehSize = 0.08 + blurFactor * 0.12;

  // Scatter 15 bokeh lights across the background
  for (var i = 0; i < 15; i = i + 1) {
    let seed = f32(i) * 127.1 + f32(i) * f32(i) * 3.7 + uniforms.randomSeed;
    let n = N13(seed);

    let pos = vec2<f32>((n.x - 0.5) * aspect * 1.5, (n.y - 0.5) * 1.2);
    let size = bokehSize * (0.5 + n.z * 0.8);

    // Variety of warm and cool light colors
    var lightColor: vec3<f32>;
    if (n.z < 0.3) {
      lightColor = vec3<f32>(1.0, 0.6, 0.2);  // Orange
    } else if (n.z < 0.5) {
      lightColor = vec3<f32>(1.0, 0.9, 0.6);  // Warm white
    } else if (n.z < 0.7) {
      lightColor = vec3<f32>(0.4, 0.6, 1.0);  // Blue
    } else {
      lightColor = vec3<f32>(1.0, 0.3, 0.2);  // Red
    }

    let d = length(coord - pos);
    let intensity = S(size * (1.0 + blurFactor), size * 0.1, d);
    let glow = S(size * 2.0, size * 0.5, d) * 0.3;

    color = color + lightColor * (intensity * 0.8 + glow) * (0.5 + n.z * 0.5);
  }

  // Subtle noise to break up banding
  let noiseScale = blur * 0.01;
  let noise = N13(uv.x * 100.0 + uv.y * 1000.0 + uniforms.time * 0.1);
  color = color + (noise - 0.5) * noiseScale;

  return color;
}

// Texture background: samples an image with mipmap-based blur
// Higher mip levels = smaller resolution = blurrier image
fn TextureBackground(uv: vec2<f32>, blur: f32) -> vec3<f32> {
  let texUV = vec2<f32>(uv.x, 1.0 - uv.y);
  let mipLevel = blur * 1.2;
  let color = textureSampleLevel(bgTexture, bgSampler, texUV, mipLevel).rgb;
  return color;
}

fn Background(uv: vec2<f32>, blur: f32) -> vec3<f32> {
  if (uniforms.useTextureBackground > 0.5) {
    return TextureBackground(uv, blur);
  } else {
    return ProceduralBackground(uv, blur);
  }
}

// =============================================================================
// MAIN FRAGMENT SHADER
// =============================================================================

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  var uv = input.uv;
  uv.y = 1.0 - uv.y;  // Flip Y so rain falls downward

  let resolution = vec2<f32>(uniforms.width, uniforms.height);
  var fragCoord = uv * resolution;
  // Center UV and normalize by height for aspect-correct drops
  var centeredUV = (fragCoord - 0.5 * resolution) / resolution.y;

  let t = uniforms.time * 0.2;
  let rainAmount = uniforms.rainAmount;

  // More rain = more blur (simulates foggy/wet conditions)
  let maxBlur = mix(uniforms.minBlur, uniforms.maxBlur, rainAmount);
  let minBlur = uniforms.minBlur;

  // Layer intensities based on rain amount
  // Light rain: mostly static drops
  // Heavy rain: all layers active
  let staticDrops = S(-0.5, 1.0, rainAmount) * 2.0;
  let layer1 = S(0.25, 0.75, rainAmount);
  let layer2 = S(0.0, 0.5, rainAmount);

  // Get drop mask and trail mask
  let c = Drops(centeredUV, t, staticDrops, layer1, layer2);
  let dropMask = c.x;

  // NORMAL CALCULATION via finite differences
  // Sample drops at slightly offset positions to estimate surface slope
  // This gives us the direction light would refract through the drop
  let e = vec2<f32>(0.002, 0.0);
  let cx = Drops(centeredUV + e, t, staticDrops, layer1, layer2).x;
  let cy = Drops(centeredUV + e.yx, t, staticDrops, layer1, layer2).x;
  let n = vec2<f32>(cx - c.x, cy - c.x);  // Surface normal (2D gradient)

  // Focus/blur: drops are sharp, background through trail is blurry
  let focus = mix(maxBlur - c.y, minBlur, S(0.1, 0.2, dropMask));

  // REFRACTION: offset UV by normal to simulate light bending through water
  // This is what makes the background appear distorted through each drop
  let refractedUV = uv + n * uniforms.refractionStrength;
  var col = Background(refractedUV, focus);

  // RIM LIGHTING: bright edge where drop surface curves away from viewer
  // Creates the 3D "dome" appearance of water drops
  let normalMag = length(n) * 30.0;
  let rimLight = S(0.3, 0.8, normalMag) * dropMask * uniforms.rimLightIntensity;
  col = col + vec3<f32>(rimLight);

  // SPECULAR HIGHLIGHT: bright spot where light reflects directly to viewer
  // Simulates a light source (like a street lamp) reflecting off the drop
  let lightDir = normalize(vec2<f32>(-0.5, -0.8));
  let spec = max(0.0, dot(normalize(n + 0.0001), lightDir));
  let specHighlight = pow(spec, uniforms.specularPower) * dropMask * uniforms.specularIntensity;
  col = col + vec3<f32>(specHighlight);

  // Subtle color shift over time for visual interest
  let colFade = sin(uniforms.time * 0.1) * 0.5 + 0.5;
  col = col * mix(vec3<f32>(1.0), vec3<f32>(0.9, 0.95, 1.05), colFade * 0.2);

  // LIGHTNING: occasional bright flashes
  if (uniforms.lightningEnabled > 0.5) {
    let lt = uniforms.time * 0.5;
    var lightning = sin(lt * sin(lt * 10.0));
    lightning = lightning * pow(max(0.0, sin(lt + sin(lt))), 10.0);
    col = col * (1.0 + lightning * uniforms.lightningIntensity);
  }

  // VIGNETTE: darken edges for cinematic look
  let vignetteUV = uv - 0.5;
  col = col * (1.0 - dot(vignetteUV, vignetteUV) * 0.5);

  // Fade in at start
  let fade = S(0.0, 2.0, uniforms.time);
  col = col * fade;

  return vec4<f32>(col, 1.0);
}
`;class N{constructor(e){d(this,"canvas");d(this,"device");d(this,"context");d(this,"format");d(this,"pipeline");d(this,"uniformBuffer");d(this,"quadVertexBuffer");d(this,"bindGroup");d(this,"bindGroupLayout");d(this,"sampler");d(this,"backgroundTexture",null);d(this,"useTextureBackground",!1);d(this,"width",0);d(this,"height",0);d(this,"time",0);d(this,"randomSeed",Math.random()*1e3);this.canvas=e}async init(){if(!navigator.gpu)throw new Error("WebGPU not supported");const e=await navigator.gpu.requestAdapter();if(!e)throw new Error("No GPU adapter found");this.device=await e.requestDevice(),this.context=this.canvas.getContext("webgpu"),this.format=navigator.gpu.getPreferredCanvasFormat(),this.context.configure({device:this.device,format:this.format,alphaMode:"premultiplied"}),this.createBuffers(),this.createSampler(),this.createPlaceholderTexture(),this.createPipeline()}createBuffers(){const e=new Float32Array([-1,-1,0,1,1,-1,1,1,-1,1,0,0,1,1,1,0]);this.quadVertexBuffer=this.device.createBuffer({size:e.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.device.queue.writeBuffer(this.quadVertexBuffer,0,e),this.uniformBuffer=this.device.createBuffer({size:80,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}createSampler(){this.sampler=this.device.createSampler({magFilter:"linear",minFilter:"linear",mipmapFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"})}createPlaceholderTexture(){this.backgroundTexture=this.device.createTexture({size:[1,1],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),this.device.queue.writeTexture({texture:this.backgroundTexture},new Uint8Array([0,0,0,255]),{bytesPerRow:4},[1,1])}createPipeline(){const e=this.device.createShaderModule({code:G});this.bindGroupLayout=this.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}}]}),this.updateBindGroup(),this.pipeline=this.device.createRenderPipeline({layout:this.device.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayout]}),vertex:{module:e,entryPoint:"vertexMain",buffers:[{arrayStride:16,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x2"}]}]},fragment:{module:e,entryPoint:"fragmentMain",targets:[{format:this.format}]},primitive:{topology:"triangle-strip"}})}updateBindGroup(){this.bindGroup=this.device.createBindGroup({layout:this.bindGroupLayout,entries:[{binding:0,resource:{buffer:this.uniformBuffer}},{binding:1,resource:this.sampler},{binding:2,resource:this.backgroundTexture.createView()}]})}async setBackground(e){if(e===null){this.useTextureBackground=!1;return}try{const i=await(await fetch(e)).blob(),n=await createImageBitmap(i);this.backgroundTexture&&this.backgroundTexture.width>1&&this.backgroundTexture.destroy();const s=Math.floor(Math.log2(Math.max(n.width,n.height)))+1;this.backgroundTexture=this.device.createTexture({size:[n.width,n.height],format:"rgba8unorm",mipLevelCount:s,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.STORAGE_BINDING}),this.device.queue.copyExternalImageToTexture({source:n},{texture:this.backgroundTexture},[n.width,n.height]),await this.generateMipmaps(this.backgroundTexture,n.width,n.height),this.useTextureBackground=!0,this.updateBindGroup()}catch(t){console.error("Failed to load background image:",t)}}async generateMipmaps(e,t,i){const s=this.device.createShaderModule({code:`
      @group(0) @binding(0) var inputTex: texture_2d<f32>;
      @group(0) @binding(1) var outputTex: texture_storage_2d<rgba8unorm, write>;
      @group(0) @binding(2) var texSampler: sampler;

      @compute @workgroup_size(8, 8)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let outputSize = textureDimensions(outputTex);
        if (id.x >= outputSize.x || id.y >= outputSize.y) {
          return;
        }
        let uv = (vec2<f32>(id.xy) + 0.5) / vec2<f32>(outputSize);
        let color = textureSampleLevel(inputTex, texSampler, uv, 0.0);
        textureStore(outputTex, id.xy, color);
      }
    `}),o=this.device.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"main"}}),h=this.device.createSampler({magFilter:"linear",minFilter:"linear"});let g=t,m=i,p=0;for(;g>1||m>1;){const u=Math.max(1,Math.floor(g/2)),b=Math.max(1,Math.floor(m/2)),w=this.device.createBindGroup({layout:o.getBindGroupLayout(0),entries:[{binding:0,resource:e.createView({baseMipLevel:p,mipLevelCount:1})},{binding:1,resource:e.createView({baseMipLevel:p+1,mipLevelCount:1})},{binding:2,resource:h}]}),y=this.device.createCommandEncoder(),f=y.beginComputePass();f.setPipeline(o),f.setBindGroup(0,w),f.dispatchWorkgroups(Math.ceil(u/8),Math.ceil(b/8)),f.end(),this.device.queue.submit([y.finish()]),g=u,m=b,p++}}resize(e,t){const i=window.devicePixelRatio||1;this.width=Math.floor(e*i),this.height=Math.floor(t*i),this.canvas.width=this.width,this.canvas.height=this.height,this.canvas.style.width=`${e}px`,this.canvas.style.height=`${t}px`}update(e,t,i){this.time=t;const n=new Float32Array([this.time,this.width,this.height,i.rainAmount,i.dropSpeed,i.sawProbability,i.dropSize,i.minBlur,i.maxBlur,i.refractionStrength,i.rimLightIntensity,i.specularIntensity,i.specularPower,i.lightningEnabled?1:0,i.lightningIntensity,this.useTextureBackground?1:0,this.randomSeed,0,0,0]);this.device.queue.writeBuffer(this.uniformBuffer,0,n)}render(){const e=this.device.createCommandEncoder(),t=e.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store"}]});t.setPipeline(this.pipeline),t.setBindGroup(0,this.bindGroup),t.setVertexBuffer(0,this.quadVertexBuffer),t.draw(4),t.end(),this.device.queue.submit([e.finish()])}}class q{constructor(){d(this,"renderer");d(this,"lastTime",0);d(this,"accumulatedTime",0);d(this,"gui");d(this,"controls",{paused:!1});d(this,"params",{background:"Diagon Alley",rainAmount:.8,dropSpeed:.75,sawProbability:.4,dropSize:1,minBlur:2,maxBlur:6,refractionStrength:.5,rimLightIntensity:.08,specularIntensity:.15,specularPower:20,lightningEnabled:!0,lightningIntensity:.3});d(this,"backgrounds",{"Neon Night":null,"Diagon Alley":"/raindrop/backgrounds/diagon_alley.jpg"})}async init(){const e=document.createElement("canvas");e.id="webgpu-canvas",document.querySelector("#app").appendChild(e),this.renderer=new N(e),await this.renderer.init(),await this.renderer.setBackground(this.backgrounds[this.params.background]),this.setupGUI(),this.setupResizeHandler(),this.start()}setupGUI(){this.gui=new k,this.gui.add(this.controls,"paused").name("Paused"),this.gui.addFolder("Scene").add(this.params,"background",Object.keys(this.backgrounds)).name("Background").onChange(async o=>{const h=this.backgrounds[o];await this.renderer.setBackground(h)});const t=this.gui.addFolder("Rain");t.add(this.params,"rainAmount",0,1,.01).name("Amount"),t.add(this.params,"dropSpeed",.1,2,.05).name("Speed"),t.add(this.params,"sawProbability",0,1,.05).name("Stop Probability");const i=this.gui.addFolder("Blur");i.add(this.params,"minBlur",0,6,.1).name("Min Blur"),i.add(this.params,"maxBlur",0,10,.1).name("Max Blur");const n=this.gui.addFolder("Drop Appearance");n.add(this.params,"refractionStrength",0,2,.05).name("Refraction"),n.add(this.params,"rimLightIntensity",0,.5,.01).name("Rim Light"),n.add(this.params,"specularIntensity",0,.5,.01).name("Specular"),n.add(this.params,"specularPower",5,50,1).name("Specular Sharpness");const s=this.gui.addFolder("Effects");s.add(this.params,"lightningEnabled").name("Lightning"),s.add(this.params,"lightningIntensity",0,1,.05).name("Lightning Intensity"),this.gui.close()}setupResizeHandler(){const e=()=>{const t=window.innerWidth,i=window.innerHeight;this.renderer.resize(t,i)};window.addEventListener("resize",e),e()}start(){requestAnimationFrame(this.loop.bind(this))}loop(e){const t=Math.min((e-this.lastTime)/1e3,.1);if(this.lastTime=e,this.controls.paused){requestAnimationFrame(this.loop.bind(this));return}this.accumulatedTime+=t,this.renderer.update(t,this.accumulatedTime,this.params),this.renderer.render(),requestAnimationFrame(this.loop.bind(this))}}const Y=new q;Y.init().catch(console.error);
