var app = {
    init: function () {
        const context = cast.framework.CastReceiverContext.getInstance();
        const playerManager = context.getPlayerManager();

        // intercept the LOAD request to be able to read in a contentId and get data
        playerManager.setMessageInterceptor(
            cast.framework.messages.MessageType.LOAD, loadRequestData => {
                if (loadRequestData.media && loadRequestData.media.contentId) {
                    console.log("contentId=" + loadRequestData.media.contentId);
                    console.log("contentUrl=" + loadRequestData.media.contentUrl);
                }
                return loadRequestData;
            }
        );

        // listen to all Core Events
        playerManager.addEventListener(cast.framework.events.category.CORE,
            event => {
              console.log(event);
            }
        );

        const playbackConfig = new cast.framework.PlaybackConfig();
        // Sets the player to start playback as soon as there are five seconds of
        // media contents buffered. Default is 10.
        playbackConfig.autoResumeDuration = 5;

        context.start({playbackConfig: playbackConfig});
    }
};

$(document).ready(function () {
    app.init();
});
