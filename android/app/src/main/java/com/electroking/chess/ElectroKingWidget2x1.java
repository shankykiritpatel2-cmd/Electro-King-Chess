package com.electroking.chess;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class ElectroKingWidget2x1 extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        int[] ids = appWidgetManager.getAppWidgetIds(new ComponentName(context, ElectroKingWidget2x1.class));
        for (int id : ids) {
            updateAppWidget(context, appWidgetManager, id);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences("ElectroKingWidgets", Context.MODE_PRIVATE);
        String title = prefs.getString("title", "ELECTRO KING ⚡");
        String subtitle = prefs.getString("subtitle", "⚡ Ready to Battle");
        String theme = prefs.getString("theme", "cyber");

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_2x1);
        views.setTextViewText(R.id.widget_title, title);
        views.setTextViewText(R.id.widget_subtitle, subtitle);

        int bgRes = R.drawable.widget_bg_cyber;
        int titleColor = android.graphics.Color.parseColor("#00f5d4");
        int subColor = android.graphics.Color.parseColor("#ffd166");

        if ("obsidian".equals(theme)) {
            bgRes = R.drawable.widget_bg_obsidian;
            titleColor = android.graphics.Color.parseColor("#4cc9f0");
            subColor = android.graphics.Color.parseColor("#b3ecff");
        } else if ("gold".equals(theme)) {
            bgRes = R.drawable.widget_bg_gold;
            titleColor = android.graphics.Color.parseColor("#ffd166");
            subColor = android.graphics.Color.parseColor("#ff9f1c");
        } else if ("matrix".equals(theme)) {
            bgRes = R.drawable.widget_bg_matrix;
            titleColor = android.graphics.Color.parseColor("#00ff66");
            subColor = android.graphics.Color.parseColor("#80ffb3");
        } else {
            bgRes = R.drawable.widget_bg_cyber;
            titleColor = android.graphics.Color.parseColor("#00f5d4");
            subColor = android.graphics.Color.parseColor("#ffd166");
        }
        views.setInt(R.id.widget_root, "setBackgroundResource", bgRes);
        views.setTextColor(R.id.widget_title, titleColor);
        views.setTextColor(R.id.widget_subtitle, subColor);

        Intent defaultIntent = new Intent(context, MainActivity.class);
        defaultIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent piDefault = PendingIntent.getActivity(context, 0, defaultIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_root, piDefault);
        views.setOnClickPendingIntent(R.id.widget_icon, piDefault);

        Intent play2pIntent = new Intent(context, MainActivity.class);
        play2pIntent.putExtra("widget_action", "play_2p");
        play2pIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent piPlay2p = PendingIntent.getActivity(context, 201, play2pIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_play_btn, piPlay2p);

        Intent puzzleIntent = new Intent(context, MainActivity.class);
        puzzleIntent.putExtra("widget_action", "puzzle");
        puzzleIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent piPuzzle = PendingIntent.getActivity(context, 202, puzzleIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_puzzle_btn, piPuzzle);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
