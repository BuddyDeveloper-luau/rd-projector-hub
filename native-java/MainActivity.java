package com.buddydeveloper.rdprojector;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(StreamLauncherPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
