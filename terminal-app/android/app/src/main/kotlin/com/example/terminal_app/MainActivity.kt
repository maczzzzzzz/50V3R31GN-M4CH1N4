package com.example.terminal_app

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import android.content.Intent
import android.net.Uri

class MainActivity : FlutterActivity() {
    private val CHANNEL = "openclaw/device"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "device.open_app" -> {
                    val packageName = call.argument<String>("package")
                    if (packageName != null) {
                        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
                        if (launchIntent != null) {
                            startActivity(launchIntent)
                            result.success(true)
                        } else {
                            result.error("UNAVAILABLE", "App not found", null)
                        }
                    } else {
                        result.error("INVALID_ARGUMENT", "Package name is null", null)
                    }
                }
                "android_read_screen" -> {
                    // TODO: Implement AccessibilityTree serialization
                    result.success("::/ACCESS_TREE_STUB")
                }
                "device.get_vitals" -> {
                    val vitals = mapOf(
                        "battery" to 85, // Stub
                        "thermal" to "normal"
                    )
                    result.success(vitals)
                }
                else -> result.notImplemented()
            }
        }
    }
}
