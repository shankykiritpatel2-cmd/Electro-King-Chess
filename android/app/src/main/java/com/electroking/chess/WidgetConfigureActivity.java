package com.electroking.chess;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

public class WidgetConfigureActivity extends AppCompatActivity {

    private int appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID;
    private EditText titleInput;
    private EditText subInput;
    private RadioGroup themeGroup;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setResult(RESULT_CANCELED);
        setContentView(R.layout.activity_widget_configure);

        Intent intent = getIntent();
        Bundle extras = intent.getExtras();
        if (extras != null) {
            appWidgetId = extras.getInt(
                    AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        }

        titleInput = findViewById(R.id.cfg_title_input);
        subInput = findViewById(R.id.cfg_sub_input);
        themeGroup = findViewById(R.id.cfg_theme_group);
        Button saveBtn = findViewById(R.id.cfg_save_btn);

        SharedPreferences prefs = getSharedPreferences("ElectroKingWidgets", Context.MODE_PRIVATE);
        String currentTitle = prefs.getString("title", "ELECTRO KING ⚡");
        String currentSub = prefs.getString("subtitle", "⚡ Ready to Battle");
        String currentTheme = prefs.getString("theme", "cyber");

        titleInput.setText(currentTitle);
        subInput.setText(currentSub);

        if ("obsidian".equals(currentTheme)) {
            ((RadioButton) findViewById(R.id.cfg_radio_obsidian)).setChecked(true);
        } else if ("gold".equals(currentTheme)) {
            ((RadioButton) findViewById(R.id.cfg_radio_gold)).setChecked(true);
        } else if ("matrix".equals(currentTheme)) {
            ((RadioButton) findViewById(R.id.cfg_radio_matrix)).setChecked(true);
        } else {
            ((RadioButton) findViewById(R.id.cfg_radio_cyber)).setChecked(true);
        }

        saveBtn.setOnClickListener(v -> {
            String title = titleInput.getText().toString().trim();
            if (title.isEmpty()) title = "ELECTRO KING ⚡";
            String sub = subInput.getText().toString().trim();
            if (sub.isEmpty()) sub = "⚡ Ready to Battle";

            String theme = "cyber";
            int checkedId = themeGroup.getCheckedRadioButtonId();
            if (checkedId == R.id.cfg_radio_obsidian) theme = "obsidian";
            else if (checkedId == R.id.cfg_radio_gold) theme = "gold";
            else if (checkedId == R.id.cfg_radio_matrix) theme = "matrix";
            else theme = "cyber";

            prefs.edit()
                    .putString("title", title)
                    .putString("subtitle", sub)
                    .putString("theme", theme)
                    .apply();

            ElectroKingWidget4x1.updateAllWidgets(this);
            ElectroKingWidget2x1.updateAllWidgets(this);
            ElectroKingWidget1x2.updateAllWidgets(this);
            ElectroKingWidget.updateAllWidgets(this);

            Toast.makeText(this, "Widget Updated! ⚡", Toast.LENGTH_SHORT).show();

            Intent resultValue = new Intent();
            resultValue.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
            setResult(RESULT_OK, resultValue);
            finish();
        });
    }
}
