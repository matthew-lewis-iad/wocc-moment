var Utils =
{
	Events: {
		AUDIO_LOADED: 'audioLoaded',
		SWIPE: 'swipe',
	},
	SWIPE_THRESHOLD_MS: 1000,
	SWIPE_THRESHOLD_X_PX: 100,
	SWIPE_THRESHOLD_Y_PX: 100,
	AUDIO: {
		BACKGROUND_LOOP: 'assets/audio/happy-hal/hal_ambient_roie_shpigler_peace.m4a',
		CLIMATE_INTRO: 'assets/audio/happy-hal/hal_sfx_climate_intro.m4a',
		LIGHT_INTRO: 'assets/audio/happy-hal/hal_sfx_light_intro.m4a',
		NUTRIENTS_INTRO: 'assets/audio/happy-hal/hal_sfx_nutrients_intro.m4a',
		HOME_INTRO: 'assets/audio/happy-hal/hal_sfx_home_intro.m4a',
		INTERRUPT_AUTOPLAY: 'assets/audio/happy-hal/hal_sfx_interrupt_autoplay.m4a',
		MAIN_NAV_TAP: 'assets/audio/happy-hal/hal_sfx_main_nav_tap.m4a',
		SUBNAV_TAP: 'assets/audio/happy-hal/hal_sfx_subnav_tap.m4a',
		HAL_APPEAR: 'assets/audio/happy-hal/hal_sfx_hal_appear.m4a',
	},
	audioContext: null,
	// audioBuffers: {},

	initAudio()
	{
		Utils.audioContext = new (window.AudioContext || window.webkitAudioContext)();
		const audioKeys = Object.keys(Utils.AUDIO);
		let loadPromises = audioKeys.map(key => {
			return fetch(Utils.AUDIO[key])
				.then(response => response.arrayBuffer())
				.then(arrayBuffer => Utils.audioContext.decodeAudioData(arrayBuffer))
				.then(audioBuffer => {
					// Utils.audioBuffers[key] = audioBuffer;
					Utils.AUDIO[key] = {
						id: key,
						buffer: audioBuffer
					};
				});
		});
		Promise.all(loadPromises).then(() => {
			console.log('All audio buffers loaded');
		});
	},

	async loadAudioToBuffer(parent, key, url, id = Date.now())
	{
		if (Utils.audioContext == null) Utils.audioContext = new (window.AudioContext || window.webkitAudioContext)();
		return fetch(url)
			.then(response => response.arrayBuffer())
			.then(arrayBuffer => Utils.audioContext.decodeAudioData(arrayBuffer))
			.then(audioBuffer => {
				parent[key] = {
					id,
					buffer: audioBuffer
				};
				return audioBuffer;
			})
			.catch(error => {
				console.error(`Error loading audio ${key}:`, error);
				return null;
			});
	},

	playSound(audioData, options)
	{
		setTimeout(function() {
			if (!audioData) return;
			const ctx = Utils.audioContext;
			const source = ctx.createBufferSource();
			source.buffer = audioData.buffer;
			source.loop = options?.loop ? true : false;
			const gainNode = ctx.createGain();
			gainNode.gain.value = window.Autoplay?.active ? 0 : 1;
			source.connect(gainNode).connect(ctx.destination);
			source.start(0);
		}, options?.delay ?? 0);
	},

	fadeinAudio(audioData, options)
	{
		if (!audioData || window.Autoplay?.active) return;
		console.log(`Utils : fadeinAudio ${audioData.id}`);
		const ctx = Utils.audioContext;
		if (!audioData.source)
		{
			audioData.source = ctx.createBufferSource();
			audioData.source.buffer = audioData.buffer;
			audioData.source.loop = options?.loop ? true : false;
			audioData.gainNode = ctx.createGain();
			audioData.gainNode.gain.value = 0;
			audioData.source.connect(audioData.gainNode).connect(ctx.destination);
			audioData.source.start();
		}
		const step = options.duration / 20;
		let currentStep = 0;
		clearInterval(audioData.fadeinInterval);
		clearInterval(audioData.fadeoutInterval);
		audioData.fadeinInterval = setInterval((audioData) => {
			currentStep++;
			audioData.gainNode.gain.value = Math.min(currentStep / 20, 1);
			if (audioData.gainNode.gain.value >= 1) {
				clearInterval(audioData.fadeinInterval);
			}
		}, step, audioData);
	},

	fadeoutAudio(audioData, options)
	{
		if (!audioData || !audioData.source) return;
		console.log(`Utils : fadeoutAudio ${audioData.id}`);
		const step = options.duration / 20;
		let currentStep = 20;
		clearInterval(audioData.fadeinInterval);
		clearInterval(audioData.fadeoutInterval);
		audioData.fadeoutInterval = setInterval((audioData) => {
			currentStep--;
			audioData.gainNode.gain.value = Math.max(currentStep / 20, 0);
			if (audioData.gainNode.gain.value <= 0) {
				clearInterval(audioData.fadeoutInterval);
				if (!audioData.source.loop)
				{
					audioData.source.stop();
					audioData.source = null;
				}
			}
		}, step, audioData);
	},

	activateInteractionListeners()
	{
		// Utils.log('Utils : activateTouchIndicator touch');
		$(window).on('touchstart', Utils.onWindowTouchStart);
		$(window).on('touchmove', Utils.onWindowTouchMove);
		$(window).on('touchend', Utils.onWindowTouchEnd);
	},

	onWindowTouchStart(e)
	{
		// Utils.log('Utils : onWindowTouchStart swipe');
		if (e.changedTouches[0].identifier != 0) return;
		Utils.swipeTouchStartMs = Date.now();
		Utils.swipeTouchStartClientX = e.changedTouches[0].clientX;
		Utils.swipeTouchStartClientY = e.changedTouches[0].clientY;
		
		// let zoom = parseFloat(getComputedStyle($('html')[0]).zoom);
		// Particles.createTouchParticles({ type: 'click', x: e.changedTouches[0].clientX / zoom, y: e.changedTouches[0].clientY / zoom });
	},

	onWindowTouchMove(e)
	{
		// console.log('Utils : onWindowTouchMove');
		// console.dir(e);
		// let zoom = parseFloat(getComputedStyle($('html')[0]).zoom);
		// Particles.createTouchParticles({ type: 'move', x: e.changedTouches[0].clientX / zoom, y: e.changedTouches[0].clientY / zoom });
	},

	onWindowTouchEnd(e)
	{
		if (e.changedTouches[0].identifier != 0) return;
		if (Date.now() - Utils.swipeTouchStartMs < Utils.SWIPE_THRESHOLD_MS)
		{
			let touchDiffX = e.changedTouches[0].clientX - Utils.swipeTouchStartClientX;
			let touchDiffY = e.changedTouches[0].clientY - Utils.swipeTouchStartClientY;
			let direction;
			if (touchDiffY <= -Utils.SWIPE_THRESHOLD_Y_PX)
			{
				direction = 'up';
			}
			else if (touchDiffY >= Utils.SWIPE_THRESHOLD_Y_PX)
			{
				direction = 'down';
			}
			else if (touchDiffX <= -Utils.SWIPE_THRESHOLD_X_PX)
			{
				direction = 'left';
			}
			else if (touchDiffX >= Utils.SWIPE_THRESHOLD_X_PX)
			{
				direction = 'right';
			}

			if (direction)
			{
				let anEvent = new Event(Utils.Events.SWIPE);
				anEvent.direction = direction;
				anEvent.startPos = {
					x: Utils.swipeTouchStartClientX,
					y: Utils.swipeTouchStartClientY
				};
				anEvent.endPos = {
					x: e.changedTouches[0].clientX,
					y: e.changedTouches[0].clientY
				};
				window.dispatchEvent(anEvent);
			}
		}
	},

	showInteractionInstructions()
	{
		$('.interaction-instruction-individual').addClass('show');
		setTimeout(function() {
			$('.interaction-instruction-individual').removeClass('show');
		}, 6000);
	},

	activateHiddenRefreshButton()
	{
		$('#hidden-refresh-button').on('click', function() {
			let now = Date.now();
			if (window.lastHiddenButtonTap && now - window.lastHiddenButtonTap < 200)
			{
				window.location.reload();
			}
			window.lastHiddenButtonTap = Date.now();
		});
	},

	addDevGuide(type, position)
	{
		let guide;
		if (type == 'vertical')
		{
			guide = Utils.createDiv({classes: 'dev-guide-vertical'});
			guide.style.left = String(position) + 'px';
		}
		else
		{
			guide = Utils.createDiv({classes: 'dev-guide-horizontal'});
			guide.style.top = String(position) + 'px';
		}
		$('#dev').append(guide);
	},

	setAutoZoom(autoZoom, dimensions, delay)
	{
		Utils.autoZoomDimensions = dimensions;
		if (autoZoom)
		{
			window.addEventListener('resize', Utils.onWindowResize);
			setTimeout(function() {
				Utils.onWindowResize();
			}, delay ? 250 : 50);
		}
		else
		{
			window.removeEventListener('resize', Utils.onWindowResize);
			$('html')[0].style.zoom = 1;
		}
	},

	onWindowResize(e)
	{
		// console.log(`Utils : onWindowResize ${window.innerWidth}x${window.innerHeight}`);
		let xZoom = window.innerWidth / Utils.autoZoomDimensions.width;
		let yZoom = window.innerHeight / Utils.autoZoomDimensions.height;
		$('html')[0].style.zoom = Math.min(xZoom, yZoom);
	},

	checkUrlParams()
	{
	    let params = new URLSearchParams(window.location.search);
	    if (params.get('screen_id'))
	    {
			SCREEN_ID = params.get('screen_id');
	    }
		$('#screen-id')[0].innerHTML = 'Screen Id: ' + SCREEN_ID;
	},

	initGoogleAnalytics()
	{
	    Utils.track('js', new Date());
	    Utils.track('config', window.GA_MEASUREMENT_ID, {
	        send_page_view: false
	    });
	},

	track(type, id, data)
	{
	    if (gtag) gtag(type, id, data);
	},

	bindMethods(objectToBind)
	{
		let prototype = objectToBind.__proto__;
		while (prototype && prototype !== Object.prototype) {
			let propertyNamesArray = Object.getOwnPropertyNames(prototype);
			for (let i = 0; i < propertyNamesArray.length; i++) {
				if (typeof objectToBind[propertyNamesArray[i]] === 'function' && propertyNamesArray[i] !== 'constructor') {
					objectToBind[propertyNamesArray[i]] = objectToBind[propertyNamesArray[i]].bind(objectToBind);
				}
			}
			prototype = Object.getPrototypeOf(prototype); // Traverse up the prototype chain
		}
	},

    killEvent(e)
    {
        e.preventDefault();
        e.stopImmediatePropagation();
    },

	log(message, overwrite)
	{
		if (overwrite)
		{
			$('#log-messages').prepend(message + '\n');
		}
		else
		{
			$('#log-messages')[0].innerHTML = message;
		}
		console.log(`Log: ${message}`);
	},

	shuffleArray(array)
	{
		array.sort(function(a, b) {
			return Math.random() > .5 ? 1 : -1
		});
	},

	ease(x, type)
	{
		if (type == 'outQuint')
		{
			return 1 - Math.pow(1 - x, 5);
		}
		else if (type == 'outCirc')
		{
			return Math.sqrt(1 - Math.pow(x - 1, 2));
		}
		else if (type == 'outCubic')
		{
			return 1 - Math.pow(1 - x, 3);
		}
		else if (type == 'inCubic')
		{
			return x * x * x;
		}
		else if (type == 'inQuint')
		{
			return x * x * x * x * x;
		}
		else if (type == 'inOutQuint')
		{
			return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
		}
		else if (type == 'inBack')
		{
			let c1 = 1.70158;
			let c3 = c1 + 1;

			return c3 * x * x * x - c1 * x * x;
		}
		else if (type == 'inOutBack')
		{
			let c1 = 1.70158;
			let c2 = c1 * 1.525;

			return x < 0.5
			  ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
			  : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
		}
		else if (type == 'outBack')
		{
			let c1 = 1.70158;
			let c3 = c1 + 1;

			return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
		}
		else if (type == 'inOutSine')
		{
			return -0.5 * ( Math.cos( Math.PI * x ) - 1 );
		}
		else if (type == 'inOutCubic')
		{
			return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
		}
		else if (type == 'inOutQuad')
		{
			return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
		}
		else if (type == 'inSine')
		{
			return 1 - Math.cos((x * Math.PI) / 2);
		}
		else if (type == 'outQuad')
		{
			return 1 - (1 - x) * (1 - x);
		}
		else if (type == 'inQuad')
		{
			return x * x;
		}
		else if (type == 'outExpo')
		{
			return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
		}
		else if (type == 'outExpoSlow')
		{
			// return Utils.cubicBezier(x, 0, 0.68, .12, .76);
			return Utils.cubicBezier(x, 0, 1, 0, 1);
		}
		else if (type == null || type == 'default')
		{
			// cubic-bezier(.25, .1, .25, 1)
			return 3 * Math.pow(1-x, 2) * x * .1 + 3 * (1-x) * Math.pow(x, 2) * 1 + Math.pow(x, 3);
		}
	},

	cubicBezier(t, p1x, p1y, p2x, p2y)
	{
		// Calculate the bezier curve
		const tCubed = t * t * t;
		const tSquared = t * t;
		const tLinear = t;
	
		return (
			(1 - t) * (1 - t) * (1 - t) * 0 +
			3 * (1 - t) * (1 - t) * t * p1x +
			3 * (1 - t) * t * t * p2x +
			t * t * t * 1 +
			(p1y * (3 * tSquared - 6 * t + 4) +
			p2y * (-3 * tSquared + 3 * t)) * t
		);
	},

	hexToRgba(hexString, alpha, returnType)
	{
		let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexString);
		if (returnType == 'object')
		{
			return {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
				a: alpha
			}
		}
		return 'rgba(' + String(parseInt(result[1], 16)) + ',' + String(parseInt(result[2], 16)) + ',' + String(parseInt(result[3], 16)) + ',' + alpha + ')';
	},

	hexToHsl(hex)
	{
		let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		r = parseInt(result[1], 16);
		g = parseInt(result[2], 16);
		b = parseInt(result[3], 16);
		r /= 255, g /= 255, b /= 255;
		let max = Math.max(r, g, b), min = Math.min(r, g, b);
		let h, s, l = (max + min) / 2;
		if(max == min) {
			h = s = 0; // achromatic
		}
		else {
			let d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch(max) {
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}
			h /= 6;
		}
		let HSL = new Object();
		HSL['h']=h*360;
		HSL['s']=s*100;
		HSL['l']=l*100;
		return HSL;
	},

	hslToHex(hsl)
	{
		const h = hsl.h;
		const s = hsl.s;
		const l = hsl.l;
	  
		const hDecimal = l / 100;
		const a = (s * Math.min(hDecimal, 1 - hDecimal)) / 100;
		const f = (n) => {
			const k = (n + h / 30) % 12;
			const color = hDecimal - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);

			// Convert to Hex and prefix with "0" if required
			return Math.round(255 * color)
			.toString(16)
			.padStart(2, "0");
		};
		return `#${f(0)}${f(8)}${f(4)}`;
	},

	hexColorFromString(stringValue)
	{
		if (stringValue == null) return null;
		return parseInt(stringValue.slice(1), 16);
	},

	blendColors(colorA, colorB, amount)
	{
		let [rA, gA, bA] = colorA.match(/\w\w/g).map((c) => parseInt(c, 16));
		let [rB, gB, bB] = colorB.match(/\w\w/g).map((c) => parseInt(c, 16));
		let r = Math.round(rA + (rB - rA) * amount).toString(16).padStart(2, '0');
		let g = Math.round(gA + (gB - gA) * amount).toString(16).padStart(2, '0');
		let b = Math.round(bA + (bB - bA) * amount).toString(16).padStart(2, '0');
		return '#' + r + g + b;
	},

    getPixelColor(imageData, width, x, y)
    {
        let base = (Math.floor(y) * width + Math.floor(x)) * 4;
        let c = {
            r: imageData[base + 0],
            g: imageData[base + 1],
            b: imageData[base + 2],
            a: imageData[base + 3]
        };
        // return 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')';
        return c;
    },

    drawImageCover(canvas, image)
    {
        // let ratio = Math.max(imageCanvas.width / stateImage.image.width, imageCanvas.height / stateImage.image.height);
        // let newImageWidth = stateImage.image.width * ratio;
        // let newImageHeight = stateImage.image.height * ratio;
        // let x = (imageCanvas.width - newImageWidth) / 2;
        // let y = (imageCanvas.height - newImageHeight) / 2;
        // imageContext.drawImage(stateImage.image, x, y, newImageWidth, newImageHeight);

        const ctx = canvas.getContext('2d', {willReadFrequently: true});
        const imgWidth = image.naturalWidth;
        const imgHeight = image.naturalHeight;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
      
        // Contain
        // const ratio = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);

        // Cover
        const ratio = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
      
        const newWidth = imgWidth * ratio;
        const newHeight = imgHeight * ratio;
      
        const x = (canvasWidth - newWidth) / 2;
        const y = (canvasHeight - newHeight) / 2;
      
        ctx.drawImage(image, x, y, newWidth, newHeight);

        return ctx.getImageData(0, 0, canvasWidth, canvasHeight).data;
    },

	drawText(canvas, text, options)
	{
		let ctx = canvas.getContext('2d', {willReadFrequently: true});
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = options.color;
		ctx.font = options.fontSize + 'px ' + options.font;
		if (options.letterSpacing) ctx.letterSpacing = options.letterSpacing + 'px';
		ctx.textBaseline = 'top';

		const lines = text.split('\n');
		if (options.position == 'center')
		{
			ctx.textAlign = 'center';
			const textHeight = (lines.length - 1) * options.lineHeight + options.fontSize;
			let yPos = canvas.height / 2 - textHeight / 2;
			for (const line of lines)
			{
				ctx.fillText(line, canvas.width / 2, yPos);
				yPos += options.lineHeight;
			}
		}
		else
		{
			let yPos = 0;
			for (const line of lines)
			{
				ctx.fillText(line, 0, yPos);
				yPos += options.fontSize;
			}
		}

		return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
	},

	getDataUrlFromImg(img)
	{
		let imageCanvas = document.createElement('canvas');
		imageCanvas.width = img.naturalWidth;
		imageCanvas.height = img.naturalHeight;
		let imageContext = imageCanvas.getContext('2d');
		imageContext.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

		return imageCanvas.toDataURL();
	},

	animateScroll(element, top, left, durationMs, ease)
	{
		if (Utils.animateScrollData && Utils.animateScrollData.element == element) delete Utils.animateScrollData;
		Utils.animateScrollData = {
			startTimeMs: Date.now(),
			durationMs: durationMs,
			element, element,
			endTop: top,
			startTop: element.scrollTop,
			endLeft: left,
			startLeft: element.scrollLeft,
			ease: ease
		};
		requestAnimationFrame(Utils.onAnimateScrollRequestAnimationFrame);
	},

	onAnimateScrollRequestAnimationFrame()
	{
		if (Utils.animateScrollData == null) return;
		let rawAnimationProgress = (Date.now() - Utils.animateScrollData.startTimeMs) / Utils.animateScrollData.durationMs;
		let animationProgress = rawAnimationProgress;
		if (Utils.animateScrollData.ease) animationProgress = Utils.ease(animationProgress, Utils.animateScrollData.ease);
		if (rawAnimationProgress >= 1)
		{
			if (Utils.animateScrollData.endTop != null)
			{
				Utils.animateScrollData.element.scrollTop = Utils.animateScrollData.endTop;
			}
			if (Utils.animateScrollData.endLeft != null)
			{
				Utils.animateScrollData.element.scrollLeft = Utils.animateScrollData.endLeft;
			}
			delete Utils.animateScrollData;
		}
		else
		{
			if (Utils.animateScrollData.endTop != null)
			{
				Utils.animateScrollData.element.scrollTop = parseInt(Utils.animateScrollData.startTop + animationProgress * (Utils.animateScrollData.endTop - Utils.animateScrollData.startTop));
			}
			if (Utils.animateScrollData.endLeft != null)
			{
				Utils.animateScrollData.element.scrollLeft = parseInt(Utils.animateScrollData.startLeft + animationProgress * (Utils.animateScrollData.endLeft - Utils.animateScrollData.startLeft));
			}
			requestAnimationFrame(Utils.onAnimateScrollRequestAnimationFrame);
		}
	},

	/* VIDEO */

	parseWebVttSubtitles(webVtt)
	{
		let splitWebVtt = webVtt.split('\r\n');
		let subtitles = [];
		for (let i4=2; i4 < splitWebVtt.length; i4+=4)
		{
			if (splitWebVtt[i4] == '') break;
			let splitStartTime = splitWebVtt[i4+1].split(' --> ')[0].split(':');
			let splitEndTime = splitWebVtt[i4+1].split(' --> ')[1].split(':');
			let startSeconds = parseInt(splitStartTime[0]) * 60 * 60 + parseInt(splitStartTime[1]) * 60 + parseFloat(splitStartTime[2]);
			let endSeconds = parseInt(splitEndTime[0]) * 60 * 60 + parseInt(splitEndTime[1]) * 60 + parseFloat(splitEndTime[2]);
			subtitles.push({
				startSeconds: startSeconds,
				endSeconds: endSeconds,
				text: splitWebVtt[i4+2]
			});
		}
		return subtitles;
	},

    textWidthCanvas: document.createElement('canvas'),

    getTextWidth(element, text, font, letterSpacing)
    {
        let context = Utils.textWidthCanvas.getContext('2d');
		if (element)
		{
			context.font = getComputedStyle(element).font;
			let letterSpacing = parseInt(getComputedStyle(element).letterSpacing);
			context.letterSpacing = isNaN(letterSpacing) ? '0px' : String(letterSpacing) + 'px';
			let testText = text ? text : element.innerHTML;
			return parseInt(context.measureText(testText).width);
		}
		else if (font)
		{
			context.font = font;
			context.letterSpacing = letterSpacing ? String(letterSpacing) + 'px' : '0px';
			return parseInt(context.measureText(text).width);
		}
        // return parseInt(context.measureText(text.toUpperCase()).width);
    },

    uuid()
    {
		var dt = Date.now();
		var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = (dt + Math.random()*16)%16 | 0;
			dt = Math.floor(dt/16);
			return (c=='x' ? r :(r&0x3|0x8)).toString(16);
		});
		return uuid;
    }
}
