package org.vicoo.app

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

/**
 * Uniqlo × VICOO Welfare application entry point.
 * Hilt generates the DI container at compile time.
 */
@HiltAndroidApp
class VICOOApplication : Application()
