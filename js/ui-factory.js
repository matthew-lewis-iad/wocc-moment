var UI = 
{
	Events: {
		PROMPT_TEXT_ANIMATION_ENDED: 'promptTextAnimationEnded',
	},

    createDiv(options)
    {
        var aDiv = document.createElement('div');
		if (options?.id) aDiv.id = options.id;
		if (options?.classes) aDiv.className = options.classes;
		if (options?.html) aDiv.innerHTML = options.html;
        
        return aDiv;
    },

	createImg(options)
	{
		var anImg = document.createElement('img');
		if (options?.src) anImg.src = options.src;
		if (options?.id) anImg.id = options.id;
		if (options?.classes) anImg.className = options.classes;

		return anImg;
	},

	createVideo(src, options)
	{
		var aVideo = document.createElement('video');
		aVideo.src = src;
		// aVideo.muted = true;
		if (options?.id) aVideo.id = options.id;
		if (options?.classes) aVideo.className = options.classes;
		if (options?.autoplay) aVideo.autoplay = options.autoplay;
		if (options?.loop) aVideo.loop = options.loop;
		if (options?.muted) aVideo.muted = options.muted;
		if (options?.poster) aVideo.poster = options.poster;
		aVideo.preload = "auto";
		return aVideo;
	},

	createCanvas(options)
	{
		const aCanvas = document.createElement('canvas');
		if (options?.id) aCanvas.id = options.id;
		if (options?.classes) aCanvas.className = options.classes;
		if (options?.width) aCanvas.width = options.width;
		if (options?.height) aCanvas.height = options.height;
		return aCanvas;
	},

	createInput(options)
	{
		const anInput = document.createElement('input');
		if (options?.id) anInput.id = options.id;
		if (options?.classes) anInput.className = options.classes;
		if (options?.placeholder) anInput.placeholder = options.placeholder;
		if (options?.text) anInput.value = options.text;
		return anInput;
	},

	createMainMenuButton(id, viewData)
	{
        const menuButton = UI.createDiv({ classes: 'main-menu-button' });
        menuButton.dataset.id = id;
        const menuButtonImage = UI.createDiv({ classes: 'main-menu-button-image' });
        menuButtonImage.style.webkitMaskImage = `url(${viewData.iconUrl})`;
        $(menuButton).append(
            menuButtonImage,
            UI.createDiv({ classes: 'main-menu-button-text', html: viewData.title }),
            UI.createPrompt(viewData.menuPrompt),
        );
		return menuButton;
	},

	createPrompt(text, container)
	{
		if (!container) {
			container = UI.createDiv({ classes: 'prompt' });
		}
		const caret = UI.createDiv({ classes: 'prompt-caret' });
		// const body = UI.createDiv({ classes: 'prompt-text', html: text });
		const body = UI.createDiv({ classes: 'prompt-text' });
		$(container).append(caret, body);
		$(container).data('promptText', text);
		return container;
	},

	animatePromptText(promptContainer, promptTextOverride)
	{
		let promptTextIndex = 0;
		const promptText = promptTextOverride ?? $(promptContainer).data('promptText');
		let charIndex = 0;
		$(promptContainer).find('.prompt-text')[0].innerHTML = '';
		UI.currentPromptAnimating = promptContainer;
		UI.killPromptTextAnimation();
		UI.promptAnimationInterval = setInterval((promptContainer, promptText) => {
			if (UI.promptAnimationWaitStartTime)
			{
				// if (Date.now() - UI.promptAnimationWaitStartTime > 5000)
				if (Date.now() - UI.promptAnimationWaitStartTime > 2500)
				{
					delete UI.promptAnimationWaitStartTime;
					charIndex = 0;
					$(promptContainer).find('.prompt-text')[0].innerHTML = '';
				}
				else 
				{
					return;
				}
			}
			const aPromptText = promptText[promptTextIndex];
			if (charIndex < aPromptText.length)
			{
				$(promptContainer).find('.prompt-text')[0].innerHTML += aPromptText[charIndex];
				charIndex++;
			}
			else
			{
				promptTextIndex++;
				if (promptTextIndex < promptText.length)
				{
					UI.promptAnimationWaitStartTime = Date.now();
				}
				else
				{
					UI.killPromptTextAnimation();
					window.dispatchEvent(new CustomEvent(UI.Events.PROMPT_TEXT_ANIMATION_ENDED, { detail: { promptContainer } }));
				}
			}
		}, 35, promptContainer, promptText);
	},

	killPromptTextAnimation()
	{
		if (UI.promptAnimationInterval)
		{
			clearInterval(UI.promptAnimationInterval);
		}
		delete UI.promptAnimationWaitStartTime;
	},

	createMiniHal()
	{
		const miniHal = UI.createDiv({ classes: 'mini-hal' });
		const miniHalBackground = UI.createImg('assets/images/happy-hal/content_background.png', { classes: 'mini-hal-background' });
		const miniHalOrb = UI.createVideo('assets/videos/happy-hal/hal_orb.webm', { classes: 'mini-hal-orb', loop: true, muted: true, preload: true });
		$(miniHal).append(miniHalBackground, miniHalOrb);
		return miniHal;
	}
}