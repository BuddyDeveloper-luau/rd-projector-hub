package com.buddydeveloper.rdprojector;

import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "StreamLauncher")
public class StreamLauncherPlugin extends Plugin {
    @PluginMethod
    public void playVideo(PluginCall call) {
        String url = call.getString("url");
        String title = call.getString("title", "Real-Debrid Stream");
        String pkg = call.getString("package", "");

        if (url == null || url.isEmpty()) {
            call.reject("Missing stream URL");
            return;
        }

        try {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(Uri.parse(url), "video/*");
            intent.putExtra("title", title);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            if (pkg != null && !pkg.isEmpty()) {
                intent.setPackage(pkg);
            }
            getContext().startActivity(intent);
            JSObject ret = new JSObject();
            ret.put("launched", true);
            call.resolve(ret);
        } catch (Exception e) {
            // Fallback to system chooser if specific player package isn't installed
            try {
                Intent fallback = new Intent(Intent.ACTION_VIEW);
                fallback.setDataAndType(Uri.parse(url), "video/*");
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(Intent.createChooser(fallback, "Play Stream With"));
                JSObject ret = new JSObject();
                ret.put("launched", true);
                ret.put("fallback", true);
                call.resolve(ret);
            } catch (Exception ex) {
                call.reject("No video player found: " + ex.getMessage());
            }
        }
    }
}
