package com.mux.sender;

import static com.google.android.gms.cast.MediaStatus.REPEAT_MODE_REPEAT_OFF;

import android.content.Intent;
import android.net.Uri;
import android.support.annotation.NonNull;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.support.v7.widget.Toolbar;
import android.view.Menu;
import android.view.View;
import android.widget.Button;

import com.google.android.gms.cast.MediaInfo;
import com.google.android.gms.cast.MediaLoadOptions;
import com.google.android.gms.cast.MediaMetadata;
import com.google.android.gms.cast.MediaQueueItem;
import com.google.android.gms.cast.framework.CastButtonFactory;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.Session;
import com.google.android.gms.cast.framework.SessionManager;
import com.google.android.gms.cast.framework.SessionManagerListener;
import com.google.android.gms.cast.framework.media.RemoteMediaClient;
import com.google.android.gms.common.api.PendingResult;
import com.google.android.gms.common.api.ResultCallback;
import com.google.android.gms.common.images.WebImage;

public class MainActivity extends AppCompatActivity {
    private CastContext castContext;
    private SessionManager sessionManager;
    private SessionManagerListener sessionManagerListener = new SessionManagerListener() {

        @Override
        public void onSessionStarting(Session session) {

        }

        @Override
        public void onSessionStarted(Session session, String s) {
            invalidateOptionsMenu();

            MediaMetadata movieMetadata = new MediaMetadata(MediaMetadata.MEDIA_TYPE_MOVIE);
            movieMetadata.putString(MediaMetadata.KEY_TITLE, "Big Buck Bunny");
            movieMetadata.putString(MediaMetadata.KEY_SUBTITLE, "The Blender Foundation");
            movieMetadata.addImage(new WebImage(Uri.parse("https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/220px-Big_buck_bunny_poster_big.jpg")));
            movieMetadata.addImage(new WebImage(Uri.parse("https://image.tmdb.org/t/p/w533_and_h300_bestv2/aHLST0g8sOE1ixCxRDgM35SKwwp.jpg")));

            MediaInfo mediaInfo = new MediaInfo.Builder("http://184.72.239.149/vod/smil:BigBuckBunny.smil/playlist.m3u8")
                    .setStreamType(MediaInfo.STREAM_TYPE_BUFFERED)
                    .setContentType("videos/m3u8")
                    .setMetadata(movieMetadata)
                    .build();
            MediaLoadOptions options = new MediaLoadOptions.Builder().setAutoplay(true).build();
            final RemoteMediaClient remoteMediaClient = sessionManager.getCurrentCastSession().getRemoteMediaClient();
            remoteMediaClient.registerCallback(new RemoteMediaClient.Callback() {
                @Override
                public void onStatusUpdated() {
                    Intent intent = new Intent(MainActivity.this, ExpandedControlsActivity.class);
                    startActivity(intent);
                    remoteMediaClient.unregisterCallback(this);
                }
            });
            remoteMediaClient.load(mediaInfo, options);
        }

        @Override
        public void onSessionStartFailed(Session session, int i) {

        }

        @Override
        public void onSessionEnding(Session session) {

        }

        @Override
        public void onSessionEnded(Session session, int i) {

        }

        @Override
        public void onSessionResuming(Session session, String s) {

        }

        @Override
        public void onSessionResumed(Session session, boolean b) {
            invalidateOptionsMenu();
        }

        @Override
        public void onSessionResumeFailed(Session session, int i) {

        }

        @Override
        public void onSessionSuspended(Session session, int i) {

        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        castContext = CastContext.getSharedInstance(this);
        sessionManager = castContext.getSessionManager();

        setContentView(R.layout.activity_main);
        Toolbar myToolbar = findViewById(R.id.my_toolbar);
        setSupportActionBar(myToolbar);

        Button button = findViewById(R.id.enqueue);
        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                MediaMetadata movieMetadata = new MediaMetadata(MediaMetadata.MEDIA_TYPE_MOVIE);
                movieMetadata.putString(MediaMetadata.KEY_TITLE, "Sintel");
                movieMetadata.putString(MediaMetadata.KEY_SUBTITLE, "The Blender Foundation");
                movieMetadata.addImage(new WebImage(Uri.parse("http://www.gigareel.com/wp-content/uploads/2016/04/i_love_sintel_by_nash88-d2zkxw5.jpg")));

                MediaInfo mediaInfo = new MediaInfo.Builder("http://d2zihajmogu5jn.cloudfront.net/sintel/master.m3u8")
                        .setStreamType(MediaInfo.STREAM_TYPE_BUFFERED)
                        .setContentType("videos/m3u8")
                        .setMetadata(movieMetadata)
                        .build();
                MediaQueueItem queueItem = new MediaQueueItem.Builder(mediaInfo)
                        .setAutoplay(true)
                        .setPreloadTime(5)
                        .build();
                RemoteMediaClient remoteMediaClient = sessionManager.getCurrentCastSession().getRemoteMediaClient();

                PendingResult<RemoteMediaClient.MediaChannelResult> result = remoteMediaClient.queueLoad(
                        new MediaQueueItem[]{queueItem}, 0,
                        REPEAT_MODE_REPEAT_OFF, null);
                result.setResultCallback(
                        new ResultCallback<RemoteMediaClient.MediaChannelResult>() {
                            @Override
                            public void onResult(
                                    @NonNull RemoteMediaClient.MediaChannelResult mediaChannelResult) {
                                if (mediaChannelResult.getStatus().isSuccess()) {
                                }
                            }
                        });
            }
        });
    }

    @Override
    protected void onResume() {
        sessionManager.addSessionManagerListener(sessionManagerListener);
        super.onResume();
    }
    @Override
    protected void onPause() {
        super.onPause();
        sessionManager.removeSessionManagerListener(sessionManagerListener);
    }

    @Override public boolean onCreateOptionsMenu(Menu menu) {
        super.onCreateOptionsMenu(menu);
        getMenuInflater().inflate(R.menu.main, menu);
        CastButtonFactory.setUpMediaRouteButton(getApplicationContext(),
                menu,
                R.id.media_route_menu_item);
        return true;
    }
}
