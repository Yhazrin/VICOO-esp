package org.tonghua.app

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

/**
 * Tonghua Public Welfare application entry point.
 * Hilt generates the DI container at compile time.
 */
@HiltAndroidApp
class TonghuaApplication : Application()
