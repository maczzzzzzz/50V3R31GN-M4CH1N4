import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz_data;
import 'package:flutter_timezone/flutter_timezone.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;

  final FlutterLocalNotificationsPlugin _notificationsPlugin = FlutterLocalNotificationsPlugin();

  NotificationService._internal();

  Future<void> init() async {
    tz_data.initializeTimeZones();
    final String timeZoneName = await FlutterTimezone.getLocalTimezone();
    tz.setLocalLocation(tz.getLocation(timeZoneName));
    
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
    );

    await _notificationsPlugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (details) {
        // Handle notification tap
      },
    );

    // Request permissions for Android 13+
    await _notificationsPlugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();
        
    // Request permission for exact alarms
    await _notificationsPlugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.requestExactAlarmsPermission();
  }

  Future<void> showPersistentEye() async {
    const AndroidNotificationDetails androidNotificationDetails =
        AndroidNotificationDetails(
      'sovereign_status',
      'Sovereign Status',
      channelDescription: 'Persistent monitoring status',
      importance: Importance.low,
      priority: Priority.low,
      ongoing: true,
      autoCancel: false,
      icon: 'ic_eye_stat', // Using our custom eye drawable
    );

    const NotificationDetails notificationDetails =
        NotificationDetails(android: androidNotificationDetails);

    await _notificationsPlugin.show(
      0, // Static ID for persistent notification
      '50V3R31GN-M4CH1N4',
      'MONITORING_ACTIVE',
      notificationDetails,
    );
  }

  Future<void> scheduleNotification(int id, String title, String body, DateTime scheduledTime) async {
    // If scheduled time is in the past, don't schedule
    if (scheduledTime.isBefore(DateTime.now())) {
      return;
    }

    await _notificationsPlugin.zonedSchedule(
      id,
      title,
      body,
      tz.TZDateTime.from(scheduledTime, tz.local),
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'sovereign_reminders',
          'Sovereign Reminders',
          channelDescription: 'Notifications for tasks and reminders',
          importance: Importance.max,
          priority: Priority.high,
          ticker: 'ticker',
          showWhen: true,
        ),
      ),
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
    );
  }

  Future<void> cancelNotification(int id) async {
    await _notificationsPlugin.cancel(id);
  }
}
