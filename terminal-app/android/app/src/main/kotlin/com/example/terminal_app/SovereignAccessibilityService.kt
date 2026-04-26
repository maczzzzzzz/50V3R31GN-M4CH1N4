package com.example.terminal_app

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import org.json.JSONArray
import org.json.JSONObject

/**
 * SOVEREIGN_ACCESSIBILITY_SERVICE — v3.8.7
 * 
 * Ingress point for 100% Mobile Screen Awareness (Semantic).
 * Serializes the Android Accessibility Tree for agentic reasoning.
 */

class SovereignAccessibilityService : AccessibilityService() {

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // We broadcast significant changes to the screen context
        if (event?.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED ||
            event?.eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) {
            
            val rootNode = rootInActiveWindow
            if (rootNode != null) {
                val jsonTree = serializeNode(rootNode)
                // TODO: Relay to MainActivity via LocalBroadcast or Static Handler
            }
        }
    }

    override fun onInterrupt() {
        // System interrupt — no-op
    }

    private fun serializeNode(node: AccessibilityNodeInfo): JSONObject {
        val json = JSONObject()
        json.put("text", node.text?.toString() ?: "")
        json.put("contentDescription", node.contentDescription?.toString() ?: "")
        json.put("className", node.className?.toString() ?: "")
        json.put("isClickable", node.isClickable)
        
        val children = JSONArray()
        for (i in 0 until node.childCount) {
            val child = node.getChild(i)
            if (child != null) {
                children.put(serializeNode(child))
            }
        }
        json.put("children", children)
        return json
    }
}
