package com.electroking.chess;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

public class MainActivity extends AppCompatActivity {

    private static final int RC_SIGN_IN = 9001;
    private static final int RC_FILE_CHOOSER = 9002;
    // Production Google AdMob Ad Unit IDs (Electro King Chess)
    private static final String ADMOB_BANNER_UNIT_ID = "ca-app-pub-1692244874353487/2145115201";
    private static final String ADMOB_REWARDED_UNIT_ID = "ca-app-pub-1692244874353487/4983031537";

    private WebView webView;
    private AdView bannerAdView;
    private RewardedAd mRewardedAd;
    private GoogleSignInClient googleSignInClient;
    private android.webkit.ValueCallback<android.net.Uri[]> filePathCallback;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep screen awake for seamless chess matches
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Enable fullscreen immersive mode
        hideSystemUI();

        // Configure Google Sign-In with real Google account verification
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .requestProfile()
                .build();
        googleSignInClient = GoogleSignIn.getClient(this, gso);

        // Initialize Google Mobile Ads (AdMob) SDK and preload rewarded ad
        try {
            MobileAds.initialize(this, initializationStatus -> loadRewardedAd());
        } catch (Exception ignored) {}

        // Root layout with pure black background (#000000) + WebView + optional bottom AdMob Banner
        LinearLayout rootLayout = new LinearLayout(this);
        rootLayout.setOrientation(LinearLayout.VERTICAL);
        rootLayout.setBackgroundColor(0xFF000000);

        webView = new WebView(this);
        webView.setBackgroundColor(0xFF000000);
        LinearLayout.LayoutParams webParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1.0f);
        rootLayout.addView(webView, webParams);

        bannerAdView = new AdView(this);
        bannerAdView.setAdSize(AdSize.BANNER);
        bannerAdView.setAdUnitId(ADMOB_BANNER_UNIT_ID);
        bannerAdView.setBackgroundColor(0xFF000000);
        bannerAdView.setVisibility(View.GONE);
        LinearLayout.LayoutParams adParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        adParams.gravity = Gravity.CENTER_HORIZONTAL;
        rootLayout.addView(bannerAdView, adParams);

        setContentView(rootLayout);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Hardware acceleration
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        // Attach Android Native Bridge for Google Sign-In
        webView.addJavascriptInterface(new WebAppInterface(), "AndroidBridge");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                handleWidgetIntent(getIntent());
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, android.webkit.ValueCallback<android.net.Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }
                MainActivity.this.filePathCallback = filePathCallback;

                Intent contentSelectionIntent = new Intent(Intent.ACTION_GET_CONTENT);
                contentSelectionIntent.addCategory(Intent.CATEGORY_OPENABLE);
                contentSelectionIntent.setType("image/*");

                Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
                chooserIntent.putExtra(Intent.EXTRA_INTENT, contentSelectionIntent);
                chooserIntent.putExtra(Intent.EXTRA_TITLE, "Select Profile Picture");

                startActivityForResult(chooserIntent, RC_FILE_CHOOSER);
                return true;
            }
        });

        // Load Electro King from packaged assets
        webView.loadUrl("file:///android_asset/index.html");
    }

    public class WebAppInterface {
        @JavascriptInterface
        public void signInWithGoogle() {
            runOnUiThread(() -> {
                Intent signInIntent = googleSignInClient.getSignInIntent();
                startActivityForResult(signInIntent, RC_SIGN_IN);
            });
        }

        @JavascriptInterface
        public void signOutGoogle() {
            runOnUiThread(() -> googleSignInClient.signOut());
        }

        @JavascriptInterface
        public void showToast(String message) {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show());
        }

        @JavascriptInterface
        public void vibrate(long milliseconds) {
            try {
                android.os.Vibrator v = (android.os.Vibrator) getSystemService(VIBRATOR_SERVICE);
                if (v != null && v.hasVibrator()) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        v.vibrate(android.os.VibrationEffect.createOneShot(milliseconds, android.os.VibrationEffect.DEFAULT_AMPLITUDE));
                    } else {
                        v.vibrate(milliseconds);
                    }
                }
            } catch (Exception ignored) {
            }
        }

        @JavascriptInterface
        public void updateAndroidWidgets(String title, String subtitle, String theme) {
            runOnUiThread(() -> {
                try {
                    android.content.SharedPreferences prefs = getSharedPreferences("ElectroKingWidgets", MODE_PRIVATE);
                    prefs.edit()
                            .putString("title", title != null ? title : "ELECTRO KING ⚡")
                            .putString("subtitle", subtitle != null ? subtitle : "⚡ Ready to Battle")
                            .putString("theme", theme != null ? theme : "cyber")
                            .apply();

                    ElectroKingWidget4x1.updateAllWidgets(MainActivity.this);
                    ElectroKingWidget2x1.updateAllWidgets(MainActivity.this);
                    ElectroKingWidget1x2.updateAllWidgets(MainActivity.this);
                    ElectroKingWidget.updateAllWidgets(MainActivity.this);

                    Intent updateIntent = new Intent(android.appwidget.AppWidgetManager.ACTION_APPWIDGET_UPDATE);
                    sendBroadcast(updateIntent);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        }

        @JavascriptInterface
        public void showRewardedAd(String rewardType) {
            runOnUiThread(() -> {
                if (mRewardedAd != null) {
                    mRewardedAd.setFullScreenContentCallback(new com.google.android.gms.ads.FullScreenContentCallback() {
                        @Override
                        public void onAdDismissedFullScreenContent() {
                            mRewardedAd = null;
                            loadRewardedAd();
                        }

                        @Override
                        public void onAdFailedToShowFullScreenContent(@NonNull com.google.android.gms.ads.AdError adError) {
                            mRewardedAd = null;
                            loadRewardedAd();
                            Toast.makeText(MainActivity.this, "Could not display ad. Please try again.", Toast.LENGTH_SHORT).show();
                        }
                    });
                    mRewardedAd.show(MainActivity.this, rewardItem -> {
                        String safeType = escapeJs(rewardType != null ? rewardType : "points");
                        String js = String.format("if (typeof window.onAdMobRewardEarned === 'function') window.onAdMobRewardEarned('%s', 50);", safeType);
                        if (webView != null) {
                            webView.post(() -> webView.evaluateJavascript(js, null));
                        }
                    });
                } else {
                    loadRewardedAd();
                    Toast.makeText(MainActivity.this, "Rewarded ad is loading. Please try again in a moment.", Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public void showBannerAd() {
            runOnUiThread(() -> {
                if (bannerAdView != null) {
                    if (bannerAdView.getVisibility() != View.VISIBLE) {
                        bannerAdView.setVisibility(View.VISIBLE);
                        bannerAdView.loadAd(new AdRequest.Builder().build());
                    }
                }
            });
        }

        @JavascriptInterface
        public void hideBannerAd() {
            runOnUiThread(() -> {
                if (bannerAdView != null) {
                    bannerAdView.setVisibility(View.GONE);
                }
            });
        }

        @JavascriptInterface
        public void exitApp() {
            runOnUiThread(() -> finishAffinity());
        }
    }

    private void loadRewardedAd() {
        AdRequest adRequest = new AdRequest.Builder().build();
        RewardedAd.load(this, ADMOB_REWARDED_UNIT_ID, adRequest, new RewardedAdLoadCallback() {
            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                mRewardedAd = null;
            }

            @Override
            public void onAdLoaded(@NonNull RewardedAd rewardedAd) {
                mRewardedAd = rewardedAd;
            }
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == RC_SIGN_IN) {
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            handleSignInResult(task);
        } else if (requestCode == RC_FILE_CHOOSER) {
            if (filePathCallback != null) {
                android.net.Uri[] results = null;
                if (resultCode == RESULT_OK && data != null) {
                    String dataString = data.getDataString();
                    if (dataString != null) {
                        results = new android.net.Uri[]{android.net.Uri.parse(dataString)};
                    } else if (data.getClipData() != null) {
                        final int numSelectedFiles = data.getClipData().getItemCount();
                        results = new android.net.Uri[numSelectedFiles];
                        for (int i = 0; i < numSelectedFiles; i++) {
                            results[i] = data.getClipData().getItemAt(i).getUri();
                        }
                    }
                }
                filePathCallback.onReceiveValue(results);
                filePathCallback = null;
            }
        }
    }

    private void handleSignInResult(Task<GoogleSignInAccount> completedTask) {
        try {
            GoogleSignInAccount account = completedTask.getResult(ApiException.class);
            if (account != null) {
                String name = account.getDisplayName() != null ? account.getDisplayName() : "Player";
                String email = account.getEmail() != null ? account.getEmail() : "";
                String photoUrl = account.getPhotoUrl() != null ? account.getPhotoUrl().toString() : "";

                String js = String.format("window.onGoogleSignInSuccess('%s', '%s', '%s');",
                        escapeJs(name), escapeJs(email), escapeJs(photoUrl));

                webView.post(() -> webView.evaluateJavascript(js, null));
            }
        } catch (ApiException e) {
            String js = String.format("window.onGoogleSignInFailure('%s');", escapeJs(e.getMessage()));
            webView.post(() -> webView.evaluateJavascript(js, null));
        }
    }

    private String escapeJs(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    private void hideSystemUI() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                final WindowInsetsController insetsController = getWindow().getInsetsController();
                if (insetsController != null) {
                    insetsController.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                    insetsController.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                }
            } else {
                getWindow().getDecorView().setSystemUiVisibility(
                        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                                | View.SYSTEM_UI_FLAG_FULLSCREEN);
            }
        } catch (Exception ignored) {
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUI();
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleWidgetIntent(intent);
    }

    private void handleWidgetIntent(Intent intent) {
        if (intent == null || webView == null) return;
        String action = intent.getStringExtra("widget_action");
        if (action != null) {
            String js = "";
            switch (action) {
                case "play_2p":
                    js = "if (typeof switchTab === 'function') switchTab('home');";
                    break;
                case "puzzle":
                    js = "if (typeof switchTab === 'function') switchTab('puzzles');";
                    break;
            }
            if (!js.isEmpty()) {
                final String evalJs = js;
                webView.postDelayed(() -> webView.evaluateJavascript(evalJs, null), 400);
            }
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) {
            webView.evaluateJavascript("if (typeof pauseGame === 'function') pauseGame();", null);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null) {
            webView.evaluateJavascript("if (typeof handleAndroidBack === 'function') handleAndroidBack(); else false;", value -> {
                if ("false".equals(value) || "null".equals(value)) {
                    new AlertDialog.Builder(MainActivity.this)
                            .setTitle("Exit Electro King?")
                            .setMessage("Are you sure you want to exit to device home?")
                            .setPositiveButton("Exit", (dialog, which) -> finish())
                            .setNegativeButton("Cancel", null)
                            .show();
                }
            });
        } else {
            super.onBackPressed();
        }
    }
}
