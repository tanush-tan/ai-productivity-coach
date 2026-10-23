import { useState } from 'react';
import './OverallReports.css';

/**
 * OverallReports Component
 *
 * Dedicated view for long-term aggregate parent analytics, study patterns,
 * and family habit trends across all supervised children and devices.
 *
 * Features:
 *   - Family-member selector: All Family Members | Liam (Grade 7) | Emma (Grade 4)
 *   - Device filter: Dynamically filtered to show only devices belonging to selected child
 *   - Date range selector: Today | Last 7 Days | Last 30 Days
 *   - Consistent telemetry updates for KPI cards, trend charts, category bars,
 *     parent summaries, and notable milestones
 *   - Honest, functional report export (.txt download + print/PDF)
 *   - Fictional demonstration data only
 */
function OverallReports() {
  // Filter states
  const [selectedMember, setSelectedMember] = useState('all'); // 'all' | 'liam' | 'emma'
  const [selectedDevice, setSelectedDevice] = useState('all'); // 'all' | "Liam's Laptop" | "Study PC" | "Tablet"
  const [dateRange, setDateRange] = useState('7days'); // 'today' | '7days' | '30days'
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Available devices per family member
  function getAllowedDevices(member) {
    if (member === 'liam') {
      return [
        { id: 'all', label: "All Liam's Devices (2)" },
        { id: "Liam's Laptop", label: "Liam's Laptop" },
        { id: 'Study PC', label: 'Study PC' },
      ];
    }
    if (member === 'emma') {
      return [
        { id: 'all', label: "All Emma's Devices (1)" },
        { id: 'Tablet', label: 'Tablet' },
      ];
    }
    return [
      { id: 'all', label: 'All Devices (3)' },
      { id: "Liam's Laptop", label: "Liam's Laptop" },
      { id: 'Study PC', label: 'Study PC' },
      { id: 'Tablet', label: 'Tablet' },
    ];
  }

  // When family member changes, ensure the selected device is valid for that child
  function handleMemberChange(newMember) {
    setSelectedMember(newMember);
    const allowed = getAllowedDevices(newMember);
    const isDeviceAllowed = allowed.some((d) => d.id === selectedDevice);
    if (!isDeviceAllowed) {
      setSelectedDevice('all');
    }
  }

  // Fictional demonstration database with consistent relationships
  const reportsDatabase = {
    // -------------------------------------------------------------------------
    // TODAY
    // -------------------------------------------------------------------------
    today: {
      all: {
        all: {
          totalStudyTime: '2h 00m',
          sessionCount: 2,
          avgFocusScore: '91%',
          productivePercent: '95%',
          distractionsBlocked: 0,
          trendTitle: 'Hourly Study Distribution (Today · All Family)',
          trendUnit: 'Minutes studied',
          chartData: [
            { label: '9 AM', value: '0m', heightPercent: 8 },
            { label: '12 PM', value: '15m', heightPercent: 25 },
            { label: '3 PM', value: '45m', heightPercent: 65 },
            { label: '5 PM', value: '15m', heightPercent: 25 },
            { label: '7 PM', value: '45m', heightPercent: 65 },
            { label: '9 PM', value: '0m', heightPercent: 8 },
          ],
          categories: [
            { name: 'STEM & Mathematics', hours: '45m', percent: 38, color: '#4f46e5' },
            { name: 'Writing & Research', hours: '45m', percent: 38, color: '#0ea5e9' },
            { name: 'Language Learning', hours: '20m', percent: 16, color: '#10b981' },
            { name: 'Tools & Reference', hours: '10m', percent: 8, color: '#8b5cf6' },
          ],
          parentSummary:
            'Liam completed two focused study blocks today covering Math homework and History essay preparation. Emma has scheduled her iPad Spanish practice for tomorrow morning. Zero distractions were recorded.',
          notableEvents: [
            { id: 1, emoji: '🎯', title: 'Focus Block Finished', desc: 'Liam completed a 45-minute calculus block with a 94% focus rating' },
            { id: 2, emoji: '⏱️', title: 'Break Compliance', desc: 'Scheduled 10-minute movement break completed promptly on Study PC' },
            { id: 3, emoji: '🛡️', title: 'Distraction-Free', desc: 'Zero unauthorized website or gaming attempts today' },
          ],
        },
        "Liam's Laptop": {
          totalStudyTime: '0h 45m',
          sessionCount: 1,
          avgFocusScore: '94%',
          productivePercent: '98%',
          distractionsBlocked: 0,
          trendTitle: "Hourly Activity (Today · Liam's Laptop)",
          trendUnit: 'Minutes studied',
          chartData: [
            { label: '9 AM', value: '0m', heightPercent: 8 },
            { label: '12 PM', value: '0m', heightPercent: 8 },
            { label: '3 PM', value: '0m', heightPercent: 8 },
            { label: '5 PM', value: '0m', heightPercent: 8 },
            { label: '7 PM', value: '45m', heightPercent: 85 },
            { label: '9 PM', value: '0m', heightPercent: 8 },
          ],
          categories: [
            { name: 'STEM & Mathematics', hours: '35m', percent: 78, color: '#4f46e5' },
            { name: 'Tools & Scratchpad', hours: '10m', percent: 22, color: '#8b5cf6' },
          ],
          parentSummary:
            "Liam's Laptop was used for an intensive evening Math & Science Focus Block. Pacing was steady with no tab switches or social media attempts.",
          notableEvents: [
            { id: 1, emoji: '🎯', title: 'Calculus Session', desc: '45m calculus problem solving with 94% focus score' },
            { id: 2, emoji: '🛡️', title: 'Whitelisted Tools', desc: 'Only Canvas LMS and Desmos Calculator active' },
          ],
        },
        'Study PC': {
          totalStudyTime: '1h 15m',
          sessionCount: 1,
          avgFocusScore: '88%',
          productivePercent: '92%',
          distractionsBlocked: 0,
          trendTitle: 'Hourly Activity (Today · Study PC)',
          trendUnit: 'Minutes studied',
          chartData: [
            { label: '9 AM', value: '0m', heightPercent: 8 },
            { label: '12 PM', value: '0m', heightPercent: 8 },
            { label: '3 PM', value: '45m', heightPercent: 65 },
            { label: '5 PM', value: '30m', heightPercent: 45 },
            { label: '7 PM', value: '0m', heightPercent: 8 },
            { label: '9 PM', value: '0m', heightPercent: 8 },
          ],
          categories: [
            { name: 'Writing & Research', hours: '50m', percent: 67, color: '#0ea5e9' },
            { name: 'Academic Search (JSTOR)', hours: '25m', percent: 33, color: '#4f46e5' },
          ],
          parentSummary:
            'The Study PC was used this afternoon for Liam’s History essay research on Google Docs. A scheduled 10-minute break was observed on time.',
          notableEvents: [
            { id: 1, emoji: '📄', title: 'Essay Draft Progress', desc: 'First draft completed in Google Docs' },
            { id: 2, emoji: '⏱️', title: 'Scheduled Break Taken', desc: '10m break logged at 04:00 PM' },
          ],
        },
        Tablet: {
          totalStudyTime: '0h 00m',
          sessionCount: 0,
          avgFocusScore: '—',
          productivePercent: '100%',
          distractionsBlocked: 0,
          trendTitle: 'Hourly Activity (Today · Tablet)',
          trendUnit: 'Minutes studied',
          chartData: [
            { label: '9 AM', value: '0m', heightPercent: 8 },
            { label: '12 PM', value: '0m', heightPercent: 8 },
            { label: '3 PM', value: '0m', heightPercent: 8 },
            { label: '5 PM', value: '0m', heightPercent: 8 },
            { label: '7 PM', value: '0m', heightPercent: 8 },
            { label: '9 PM', value: '0m', heightPercent: 8 },
          ],
          categories: [
            { name: 'Device on Standby', hours: '0m', percent: 100, color: '#94a3b8' },
          ],
          parentSummary:
            'The Tablet was on standby today with 64% battery. Emma’s next scheduled Spanish lesson is set for tomorrow morning at 10:00 AM.',
          notableEvents: [
            { id: 1, emoji: '🔋', title: 'Standby Status', desc: 'Device idle and charged; no usage logged today' },
          ],
        },
      },
    },

    // -------------------------------------------------------------------------
    // LAST 7 DAYS
    // -------------------------------------------------------------------------
    '7days': {
      all: {
        all: {
          totalStudyTime: '14h 25m',
          sessionCount: 12,
          avgFocusScore: '89%',
          productivePercent: '92%',
          distractionsBlocked: 1,
          trendTitle: 'Daily Study Hours (Last 7 Days · All Family)',
          trendUnit: 'Hours studied per day',
          chartData: [
            { label: 'Mon', value: '1.8h', heightPercent: 55 },
            { label: 'Tue', value: '2.2h', heightPercent: 70 },
            { label: 'Wed', value: '1.5h', heightPercent: 45 },
            { label: 'Thu', value: '2.5h', heightPercent: 80 },
            { label: 'Fri', value: '2.0h', heightPercent: 65 },
            { label: 'Sat', value: '3.1h', heightPercent: 100 },
            { label: 'Sun', value: '1.3h', heightPercent: 40 },
          ],
          categories: [
            { name: 'STEM & Mathematics', hours: '5h 30m', percent: 38, color: '#4f46e5' },
            { name: 'Writing & Research', hours: '4h 15m', percent: 29, color: '#0ea5e9' },
            { name: 'Language Learning', hours: '2h 40m', percent: 19, color: '#10b981' },
            { name: 'Creative & Arts', hours: '1h 30m', percent: 10, color: '#f59e0b' },
            { name: 'Tools & Reference', hours: '30m', percent: 4, color: '#8b5cf6' },
          ],
          parentSummary:
            'Total study volume increased by 12% across family hardware this week. Saturday recorded the peak study duration (3.1 hours) driven by combined coding and creative projects. 1 distraction attempt was safely intercepted.',
          notableEvents: [
            { id: 1, emoji: '🔥', title: '5-Day Study Streak', desc: 'Maintained uninterrupted study habit across all school days' },
            { id: 2, emoji: '🛡️', title: 'Shield Interception', desc: 'Gaming domain safely blocked on Study PC on Oct 22' },
            { id: 3, emoji: '⭐', title: 'Language Milestone', desc: 'Emma reached 150 XP on iPad Spanish module' },
            { id: 4, emoji: '💻', title: 'Coding Lab Tutorial', desc: 'Liam completed Python exercises with 91% focus rating' },
          ],
        },
        "Liam's Laptop": {
          totalStudyTime: '7h 45m',
          sessionCount: 6,
          avgFocusScore: '93%',
          productivePercent: '96%',
          distractionsBlocked: 0,
          trendTitle: "Daily Study Hours (Last 7 Days · Liam's Laptop)",
          trendUnit: 'Hours studied per day',
          chartData: [
            { label: 'Mon', value: '1.0h', heightPercent: 55 },
            { label: 'Tue', value: '1.2h', heightPercent: 65 },
            { label: 'Wed', value: '0.8h', heightPercent: 45 },
            { label: 'Thu', value: '1.5h', heightPercent: 80 },
            { label: 'Fri', value: '1.2h', heightPercent: 65 },
            { label: 'Sat', value: '1.5h', heightPercent: 80 },
            { label: 'Sun', value: '0.6h', heightPercent: 35 },
          ],
          categories: [
            { name: 'STEM & Mathematics', hours: '4h 15m', percent: 55, color: '#4f46e5' },
            { name: 'Coding Lab (Python)', hours: '2h 30m', percent: 32, color: '#0ea5e9' },
            { name: 'Documentation', hours: '1h 00m', percent: 13, color: '#8b5cf6' },
          ],
          parentSummary:
            "Liam's MacBook Air is his primary STEM and coding workstation. He maintained an outstanding 93% average focus with zero distraction flags or off-task interruptions.",
          notableEvents: [
            { id: 1, emoji: '🐍', title: 'Python Tutorial Passed', desc: '1h 20m code lab completed with zero tab switches' },
            { id: 2, emoji: '📐', title: 'Calculus Exercises', desc: 'Consistent 94% focus on algebra problem sets' },
            { id: 3, emoji: '⚡', title: 'Clean Record', desc: 'Zero blocked website incidents on this machine' },
          ],
        },
        'Study PC': {
          totalStudyTime: '4h 30m',
          sessionCount: 4,
          avgFocusScore: '82%',
          productivePercent: '88%',
          distractionsBlocked: 1,
          trendTitle: 'Daily Study Hours (Last 7 Days · Study PC)',
          trendUnit: 'Hours studied per day',
          chartData: [
            { label: 'Mon', value: '0.8h', heightPercent: 55 },
            { label: 'Tue', value: '1.0h', heightPercent: 70 },
            { label: 'Wed', value: '0.7h', heightPercent: 50 },
            { label: 'Thu', value: '1.0h', heightPercent: 70 },
            { label: 'Fri', value: '0.0h', heightPercent: 8 },
            { label: 'Sat', value: '0.8h', heightPercent: 55 },
            { label: 'Sun', value: '0.0h', heightPercent: 8 },
          ],
          categories: [
            { name: 'Writing & Research', hours: '3h 15m', percent: 72, color: '#0ea5e9' },
            { name: 'Literature Reading', hours: '1h 00m', percent: 22, color: '#4f46e5' },
            { name: 'Flagged Domain Attempt', hours: '15m', percent: 6, color: '#ef4444' },
          ],
          parentSummary:
            'The Study PC was used for research and literature reading. On Oct 22 at 07:28 PM, the distraction shield caught an unauthorized gaming domain and redirected the child within 2 minutes.',
          notableEvents: [
            { id: 1, emoji: '🛡️', title: 'Shield Interception', desc: 'Unauthorized gaming site blocked on Oct 22' },
            { id: 2, emoji: '📚', title: 'Literature Chapter', desc: '45m reading session successfully concluded' },
            { id: 3, emoji: '📄', title: 'History Essay', desc: '1h 15m essay research with scheduled break' },
          ],
        },
        Tablet: {
          totalStudyTime: '2h 10m',
          sessionCount: 2,
          avgFocusScore: '97%',
          productivePercent: '98%',
          distractionsBlocked: 0,
          trendTitle: 'Daily Study Hours (Last 7 Days · Tablet)',
          trendUnit: 'Hours studied per day',
          chartData: [
            { label: 'Mon', value: '0.0h', heightPercent: 8 },
            { label: 'Tue', value: '0.0h', heightPercent: 8 },
            { label: 'Wed', value: '0.0h', heightPercent: 8 },
            { label: 'Thu', value: '0.0h', heightPercent: 8 },
            { label: 'Fri', value: '0.8h', heightPercent: 65 },
            { label: 'Sat', value: '0.8h', heightPercent: 65 },
            { label: 'Sun', value: '0.5h', heightPercent: 40 },
          ],
          categories: [
            { name: 'Language Learning (Spanish)', hours: '1h 25m', percent: 65, color: '#10b981' },
            { name: 'Creative & Digital Art', hours: '45m', percent: 35, color: '#f59e0b' },
          ],
          parentSummary:
            'Emma utilized the iPad for language exercises and digital drawing. She demonstrated an exceptional 97% focus rating and met all weekly XP milestones.',
          notableEvents: [
            { id: 1, emoji: '⭐', title: 'Spanish Level 2', desc: 'Emma reached 150 XP on Duolingo module' },
            { id: 2, emoji: '🎨', title: 'Art Tutorial Export', desc: 'Completed Procreate drawing lesson with 98% focus' },
          ],
        },
      },
    },

    // -------------------------------------------------------------------------
    // LAST 30 DAYS
    // -------------------------------------------------------------------------
    '30days': {
      all: {
        all: {
          totalStudyTime: '58h 40m',
          sessionCount: 44,
          avgFocusScore: '92%',
          productivePercent: '94%',
          distractionsBlocked: 4,
          trendTitle: 'Weekly Study Hours (Last 30 Days · All Family)',
          trendUnit: 'Hours studied per week',
          chartData: [
            { label: 'Week 1', value: '13.5h', heightPercent: 82 },
            { label: 'Week 2', value: '15.2h', heightPercent: 92 },
            { label: 'Week 3', value: '16.0h', heightPercent: 100 },
            { label: 'Week 4', value: '14.0h', heightPercent: 86 },
          ],
          categories: [
            { name: 'STEM & Mathematics', hours: '24h 00m', percent: 41, color: '#4f46e5' },
            { name: 'Writing & Research', hours: '16h 30m', percent: 28, color: '#0ea5e9' },
            { name: 'Language Learning', hours: '10h 10m', percent: 17, color: '#10b981' },
            { name: 'Creative & Arts', hours: '6h 00m', percent: 10, color: '#f59e0b' },
            { name: 'Tools & Reference', hours: '2h 00m', percent: 4, color: '#8b5cf6' },
          ],
          parentSummary:
            'Over the past month, 44 supervised sessions were logged across Liam’s Laptop, Study PC, and Tablet. Study compliance averaged 94% with an overall focus rating of 92%. A solid homework routine is well established.',
          notableEvents: [
            { id: 1, emoji: '🏆', title: 'Monthly Target Exceeded', desc: 'Surpassed 50-hour family target with 58.7 total hours' },
            { id: 2, emoji: '🌟', title: 'Top Focus Subject', desc: 'STEM & Math recorded the highest engagement (41% of time)' },
            { id: 3, emoji: '🛡️', title: 'Shield Reliability', desc: '4 distraction attempts blocked; 99% distraction-free study time' },
            { id: 4, emoji: '📱', title: '3 Devices Synchronized', desc: 'All paired family hardware actively utilized for homework' },
          ],
        },
        "Liam's Laptop": {
          totalStudyTime: '32h 30m',
          sessionCount: 24,
          avgFocusScore: '94%',
          productivePercent: '96%',
          distractionsBlocked: 1,
          trendTitle: "Weekly Study Hours (Last 30 Days · Liam's Laptop)",
          trendUnit: 'Hours studied per week',
          chartData: [
            { label: 'Week 1', value: '7.5h', heightPercent: 80 },
            { label: 'Week 2', value: '8.5h', heightPercent: 92 },
            { label: 'Week 3', value: '9.0h', heightPercent: 100 },
            { label: 'Week 4', value: '7.3h', heightPercent: 78 },
          ],
          categories: [
            { name: 'STEM & Mathematics', hours: '18h 00m', percent: 55, color: '#4f46e5' },
            { name: 'Coding Lab (Python)', hours: '10h 30m', percent: 32, color: '#0ea5e9' },
            { name: 'Documentation & Tools', hours: '4h 00m', percent: 13, color: '#8b5cf6' },
          ],
          parentSummary:
            "Liam's Laptop was his most active academic device this month with 32.5 focused hours. He maintained a strong 94% average focus rating with regular evening Focus Blocks.",
          notableEvents: [
            { id: 1, emoji: '💻', title: 'Python Curriculum', desc: '10+ hours of software exercises completed' },
            { id: 2, emoji: '📐', title: 'Math Mastery', desc: '18 hours of calculus exercises logged on Canvas' },
            { id: 3, emoji: '🔥', title: 'High Adherence', desc: 'Zero off-task notifications across 23 of 24 sessions' },
          ],
        },
        'Study PC': {
          totalStudyTime: '17h 40m',
          sessionCount: 13,
          avgFocusScore: '86%',
          productivePercent: '89%',
          distractionsBlocked: 3,
          trendTitle: 'Weekly Study Hours (Last 30 Days · Study PC)',
          trendUnit: 'Hours studied per week',
          chartData: [
            { label: 'Week 1', value: '4.0h', heightPercent: 80 },
            { label: 'Week 2', value: '4.5h', heightPercent: 90 },
            { label: 'Week 3', value: '4.8h', heightPercent: 100 },
            { label: 'Week 4', value: '4.3h', heightPercent: 88 },
          ],
          categories: [
            { name: 'Writing & Research', hours: '12h 00m', percent: 68, color: '#0ea5e9' },
            { name: 'Literature Reading', hours: '4h 00m', percent: 23, color: '#4f46e5' },
            { name: 'Flagged Domain Interceptions', hours: '1h 40m', percent: 9, color: '#ef4444' },
          ],
          parentSummary:
            'The Study PC provided 17.7 hours of research and writing time. Distraction shield caught 3 domain deviations over the 30 days, keeping study sessions on track.',
          notableEvents: [
            { id: 1, emoji: '🛡️', title: '3 Deviations Blocked', desc: 'Parent shield protected study time from gaming sites' },
            { id: 2, emoji: '📑', title: 'History Essay Series', desc: '12 hours of research and citations completed' },
          ],
        },
        Tablet: {
          totalStudyTime: '8h 30m',
          sessionCount: 7,
          avgFocusScore: '96%',
          productivePercent: '97%',
          distractionsBlocked: 0,
          trendTitle: 'Weekly Study Hours (Last 30 Days · Tablet)',
          trendUnit: 'Hours studied per week',
          chartData: [
            { label: 'Week 1', value: '2.0h', heightPercent: 80 },
            { label: 'Week 2', value: '2.2h', heightPercent: 90 },
            { label: 'Week 3', value: '2.2h', heightPercent: 90 },
            { label: 'Week 4', value: '2.1h', heightPercent: 85 },
          ],
          categories: [
            { name: 'Language Learning (Spanish)', hours: '5h 30m', percent: 65, color: '#10b981' },
            { name: 'Creative & Digital Art', hours: '3h 00m', percent: 35, color: '#f59e0b' },
          ],
          parentSummary:
            'Emma logged 8.5 hours of learning on her iPad this month, consistently meeting her weekly Spanish and drawing goals with an outstanding 96% focus score.',
          notableEvents: [
            { id: 1, emoji: '⭐', title: 'Spanish Level 2 Cleared', desc: 'Completed Duolingo Unit 3 with perfect quiz scores' },
            { id: 2, emoji: '🎨', title: 'Procreate Portfolio', desc: '3 drawing tutorials finished and saved' },
            { id: 3, emoji: '🛡️', title: 'Zero Distractions', desc: 'No unauthorized app attempts recorded all month' },
          ],
        },
      },
    },
  };

  // Helper to dynamically resolve telemetry based on (member, device, dateRange)
  function getResolvedReport() {
    const timeframeData = reportsDatabase[dateRange];
    if (!timeframeData) return null;

    // If specific device is selected
    if (selectedDevice !== 'all') {
      const deviceData = timeframeData.all[selectedDevice];
      if (deviceData) return deviceData;
    }

    // If specific child is selected with "all their devices"
    if (selectedMember === 'liam') {
      if (dateRange === 'today') {
        return {
          totalStudyTime: '2h 00m',
          sessionCount: 2,
          avgFocusScore: '91%',
          productivePercent: '95%',
          distractionsBlocked: 0,
          trendTitle: "Liam's Hourly Activity (Today · Laptop & PC)",
          trendUnit: 'Minutes studied',
          chartData: [
            { label: '9 AM', value: '0m', heightPercent: 8 },
            { label: '12 PM', value: '15m', heightPercent: 25 },
            { label: '3 PM', value: '45m', heightPercent: 65 },
            { label: '5 PM', value: '15m', heightPercent: 25 },
            { label: '7 PM', value: '45m', heightPercent: 65 },
            { label: '9 PM', value: '0m', heightPercent: 8 },
          ],
          categories: [
            { name: 'STEM & Mathematics', hours: '45m', percent: 45, color: '#4f46e5' },
            { name: 'Writing & Research', hours: '45m', percent: 45, color: '#0ea5e9' },
            { name: 'Tools & Reference', hours: '10m', percent: 10, color: '#8b5cf6' },
          ],
          parentSummary:
            "Liam logged 2 hours across his Laptop (Math) and Study PC (History essay). Both sessions demonstrated high focus with zero distraction alerts.",
          notableEvents: [
            { id: 1, emoji: '🎯', title: 'Math Calculus Block', desc: '45m session with 94% focus rating on Canvas LMS' },
            { id: 2, emoji: '📄', title: 'History Essay Draft', desc: '1h 15m session on Study PC with scheduled break' },
          ],
        };
      }
      if (dateRange === '7days') {
        return {
          totalStudyTime: '12h 15m',
          sessionCount: 10,
          avgFocusScore: '88%',
          productivePercent: '91%',
          distractionsBlocked: 1,
          trendTitle: "Liam's Daily Study Hours (Last 7 Days · All Liam's Devices)",
          trendUnit: 'Hours studied per day',
          chartData: [
            { label: 'Mon', value: '1.8h', heightPercent: 55 },
            { label: 'Tue', value: '2.2h', heightPercent: 70 },
            { label: 'Wed', value: '1.5h', heightPercent: 45 },
            { label: 'Thu', value: '2.5h', heightPercent: 80 },
            { label: 'Fri', value: '1.2h', heightPercent: 45 },
            { label: 'Sat', value: '2.3h', heightPercent: 75 },
            { label: 'Sun', value: '0.8h', heightPercent: 30 },
          ],
          categories: [
            { name: 'STEM & Mathematics', hours: '5h 30m', percent: 45, color: '#4f46e5' },
            { name: 'Writing & Research', hours: '4h 15m', percent: 35, color: '#0ea5e9' },
            { name: 'Coding Lab (Python)', hours: '2h 30m', percent: 20, color: '#10b981' },
          ],
          parentSummary:
            "Liam achieved 12.25 study hours this week across his laptop and Study PC. His strongest engagement was in mathematics and coding with an 88% overall focus rating.",
          notableEvents: [
            { id: 1, emoji: '🔥', title: '5-Day Study Streak', desc: 'Consistent weekday study routine maintained' },
            { id: 2, emoji: '🛡️', title: 'Gaming Shield Trigger', desc: '1 gaming domain blocked on Study PC on Oct 22' },
            { id: 3, emoji: '💻', title: 'Python Exercise', desc: 'Terminal coding completed with 91% focus' },
          ],
        };
      }
      // 30 days
      return {
        totalStudyTime: '50h 10m',
        sessionCount: 37,
        avgFocusScore: '91%',
        productivePercent: '93%',
        distractionsBlocked: 4,
        trendTitle: "Liam's Weekly Study Hours (Last 30 Days · All Liam's Devices)",
        trendUnit: 'Hours studied per week',
        chartData: [
          { label: 'Week 1', value: '11.5h', heightPercent: 80 },
          { label: 'Week 2', value: '13.0h', heightPercent: 92 },
          { label: 'Week 3', value: '13.8h', heightPercent: 100 },
          { label: 'Week 4', value: '11.8h', heightPercent: 84 },
        ],
        categories: [
          { name: 'STEM & Mathematics', hours: '24h 00m', percent: 48, color: '#4f46e5' },
          { name: 'Writing & Research', hours: '16h 30m', percent: 33, color: '#0ea5e9' },
          { name: 'Coding Lab (Python)', hours: '9h 40m', percent: 19, color: '#10b981' },
        ],
        parentSummary:
          "Liam exceeded his 45-hour monthly study target with 50.2 hours logged across his Laptop and the Study PC. Top subjects were Math and Computer Science.",
        notableEvents: [
          { id: 1, emoji: '🏆', title: 'Monthly Target Exceeded', desc: 'Surpassed 45-hour goal with 50.2 hours logged' },
          { id: 2, emoji: '🌟', title: 'Top Focus Subject', desc: 'Mathematics recorded highest adherence (48% of time)' },
          { id: 3, emoji: '🛡️', title: 'Distraction Shields', desc: '4 unauthorized sites blocked across the month' },
        ],
      };
    }

    if (selectedMember === 'emma') {
      // Emma only uses Tablet
      return timeframeData.all.Tablet;
    }

    // Default: All family members + all devices
    return timeframeData.all.all;
  }

  const currentData = getResolvedReport();

  // Readable labels for the filter status pill
  const memberLabelMap = {
    all: 'All Family Members',
    liam: 'Liam (Grade 7)',
    emma: 'Emma (Grade 4)',
  };

  const dateLabelMap = {
    today: 'Today · Oct 24, 2026',
    '7days': 'Last 7 Days · Oct 18 – Oct 24',
    '30days': 'Last 30 Days · Sep 25 – Oct 24',
  };

  // Honest, functional file download of the customized report summary
  function handleDownloadReport() {
    const reportText = `=====================================================
AI PRODUCTIVITY COACH - OVERALL PARENT REPORT
=====================================================
Family Member : ${memberLabelMap[selectedMember]}
Device Filter : ${selectedDevice === 'all' ? 'All Applicable Devices' : selectedDevice}
Timeframe     : ${dateLabelMap[dateRange]}
Generated on  : ${new Date().toLocaleString()}
Status        : Fictional Demonstration Telemetry

1. SUMMARY METRICS
-----------------------------------------------------
- Total Supervised Study Time : ${currentData.totalStudyTime}
- Total Study Sessions        : ${currentData.sessionCount}
- Average Focus Score         : ${currentData.avgFocusScore}
- Productive Time Percentage  : ${currentData.productivePercent}
- Distraction Interceptions   : ${currentData.distractionsBlocked}

2. APPLICATION CATEGORY BREAKDOWN
-----------------------------------------------------
${currentData.categories
  .map((cat) => `• ${cat.name.padEnd(24)}: ${cat.hours.padEnd(8)} (${cat.percent}%)`)
  .join('\n')}

3. AI COACH PARENT OBSERVATION
-----------------------------------------------------
${currentData.parentSummary}

4. NOTABLE EVENTS & MILESTONES
-----------------------------------------------------
${currentData.notableEvents.map((evt) => `• [${evt.title}] ${evt.desc}`).join('\n')}

=====================================================
End of Report · AI Productivity Coach Parent Portal
=====================================================`;

    // Create an actual downloadable text file in the browser
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `AI-Coach-Report-${selectedMember}-${dateRange}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);

    // Provide visual feedback
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2400);
  }

  // Functional print/save as PDF trigger
  function handlePrintReport() {
    window.print();
  }

  const allowedDevices = getAllowedDevices(selectedMember);

  return (
    <section className="reports-view" aria-label="Overall Family Study Reports and Analytics">
      {/* 1. Header with title, demo badge, and functional export buttons */}
      <div className="reports-header-row">
        <div className="reports-header-left">
          <div className="reports-heading-wrap">
            <h2 className="reports-view-title">Overall Reports & Trends</h2>
            <span className="reports-demo-badge" title="Data shown is simulated demonstration analytics">
              <span className="reports-demo-dot" aria-hidden="true" />
              Fictional Demo Analytics
            </span>
          </div>
          <p className="reports-view-description">
            Aggregate study habits, time trends, and category breakdowns across all supervised family devices.
          </p>
        </div>

        {/* Functional Export Actions */}
        <div className="reports-header-actions">
          <button
            type="button"
            className="btn-export-download"
            onClick={handleDownloadReport}
            aria-label="Download text report summary"
          >
            {downloadSuccess ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Report Downloaded!</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download Report (.txt)</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="btn-export-print"
            onClick={handlePrintReport}
            aria-label="Print or save report as PDF"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Enhanced Filter Toolbar: Family Member, Device, and Date Range */}
      <div className="reports-toolbar">
        <div className="reports-toolbar-row">
          <div className="reports-filter-controls">
            {/* Family Member Selector */}
            <div className="reports-filter-field">
              <label htmlFor="member-select" className="reports-filter-label">
                Child / Profile:
              </label>
              <select
                id="member-select"
                className="reports-filter-select"
                value={selectedMember}
                onChange={(e) => handleMemberChange(e.target.value)}
                aria-label="Filter report by family member"
              >
                <option value="all">All Family Members</option>
                <option value="liam">Liam (Grade 7)</option>
                <option value="emma">Emma (Grade 4)</option>
              </select>
            </div>

            {/* Device Filter (respects child selection) */}
            <div className="reports-filter-field">
              <label htmlFor="device-select" className="reports-filter-label">
                Device:
              </label>
              <select
                id="device-select"
                className="reports-filter-select"
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                aria-label="Filter report by device"
              >
                {allowedDevices.map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="reports-range-group" role="tablist" aria-label="Select report date range">
            <button
              type="button"
              role="tab"
              aria-selected={dateRange === 'today'}
              className={`reports-range-btn ${dateRange === 'today' ? 'active' : ''}`}
              onClick={() => setDateRange('today')}
            >
              Today
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={dateRange === '7days'}
              className={`reports-range-btn ${dateRange === '7days' ? 'active' : ''}`}
              onClick={() => setDateRange('7days')}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={dateRange === '30days'}
              className={`reports-range-btn ${dateRange === '30days' ? 'active' : ''}`}
              onClick={() => setDateRange('30days')}
            >
              Last 30 Days
            </button>
          </div>
        </div>

        {/* Active Filter Summary Bar */}
        <div className="reports-toolbar-row" style={{ paddingTop: '4px', borderTop: '1px solid var(--border-light)' }}>
          <span className="reports-active-filter-badge">
            <span>Viewing:</span>
            <strong>{memberLabelMap[selectedMember]}</strong>
            <span>•</span>
            <strong>{selectedDevice === 'all' ? 'All Applicable Devices' : selectedDevice}</strong>
            <span>•</span>
            <strong>{dateLabelMap[dateRange]}</strong>
          </span>

          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Fictional demo data updates automatically
          </span>
        </div>
      </div>

      {/* 3. Top Summary Metrics Grid */}
      <div className="reports-metrics-grid">
        <article className="report-metric-card">
          <div className="report-metric-header">
            <span className="report-metric-label">Total Study Time</span>
            <div className="report-metric-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <span className="report-metric-val">{currentData.totalStudyTime}</span>
          <span className="report-metric-sub">{currentData.productivePercent} productive pacing</span>
        </article>

        <article className="report-metric-card">
          <div className="report-metric-header">
            <span className="report-metric-label">Session Count</span>
            <div className="report-metric-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
          </div>
          <span className="report-metric-val">{currentData.sessionCount}</span>
          <span className="report-metric-sub">Supervised focus blocks</span>
        </article>

        <article className="report-metric-card">
          <div className="report-metric-header">
            <span className="report-metric-label">Avg Focus Score</span>
            <div className="report-metric-icon" aria-hidden="true" style={{ backgroundColor: 'var(--status-active-bg)', color: 'var(--status-active-text)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
          </div>
          <span className="report-metric-val" style={{ color: currentData.avgFocusScore !== '—' ? 'var(--status-active-text)' : 'inherit' }}>
            {currentData.avgFocusScore}
          </span>
          <span className="report-metric-sub">
            {currentData.avgFocusScore !== '—' ? 'Consistent attention' : 'No sessions logged'}
          </span>
        </article>

        <article className="report-metric-card">
          <div className="report-metric-header">
            <span className="report-metric-label">Distraction Shield</span>
            <div className="report-metric-icon" aria-hidden="true" style={{ backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
          </div>
          <span className="report-metric-val">{currentData.distractionsBlocked}</span>
          <span className="report-metric-sub">
            {currentData.distractionsBlocked === 0 ? 'Zero alerts triggered' : 'Unauthorized sites blocked'}
          </span>
        </article>
      </div>

      {/* 4. Analytics Split: Study-Time Trend Chart & Category Breakdown */}
      <div className="reports-analytics-split">
        {/* Trend Bar Chart Card */}
        <div className="reports-card">
          <div className="reports-card-header">
            <div>
              <h3 className="reports-card-title">{currentData.trendTitle}</h3>
              <span className="reports-card-subtitle">{currentData.trendUnit}</span>
            </div>
            <span className="reports-demo-badge">Trend Graph</span>
          </div>

          <div className="study-chart-container" role="img" aria-label={currentData.trendTitle}>
            {currentData.chartData.map((bar, index) => (
              <div key={index} className="chart-bar-group">
                <div className="chart-bar-track">
                  <div
                    className="chart-bar-fill"
                    style={{ height: `${bar.heightPercent}%` }}
                    title={`${bar.label}: ${bar.value}`}
                  >
                    <span className="chart-bar-val">{bar.value}</span>
                  </div>
                </div>
                <span className="chart-bar-label">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Application Category Breakdown Card */}
        <div className="reports-card">
          <div className="reports-card-header">
            <div>
              <h3 className="reports-card-title">Subject & Category Breakdown</h3>
              <span className="reports-card-subtitle">Distribution of supervised hours</span>
            </div>
          </div>

          <div className="category-bars-list">
            {currentData.categories.map((cat, index) => (
              <div key={index} className="category-bar-item">
                <div className="category-bar-header">
                  <div className="category-name-group">
                    <span className="category-color-dot" style={{ backgroundColor: cat.color }} aria-hidden="true" />
                    <span>{cat.name}</span>
                  </div>
                  <span className="category-time-stat">{cat.hours} ({cat.percent}%)</span>
                </div>
                <div className="category-track">
                  <div
                    className="category-progress"
                    style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. AI Coach Parent Summary & Notable Events */}
      <div className="reports-insights-split">
        {/* Parent-Friendly AI Coach Summary */}
        <div className="insights-callout-card">
          <div className="insights-header">
            <div className="insights-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12A10 10 0 0 1 12 2z" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div>
              <h3 className="insights-title">AI Coach Parent Summary</h3>
              <span style={{ fontSize: '11px', color: '#6d28d9' }}>Focus patterns & advice</span>
            </div>
          </div>
          <p className="insights-text">{currentData.parentSummary}</p>
        </div>

        {/* Notable Events & Milestones List */}
        <div className="reports-card">
          <div className="reports-card-header">
            <h3 className="reports-card-title">Notable Events & Milestones</h3>
            <span className="reports-card-subtitle">{currentData.notableEvents.length} recorded</span>
          </div>

          <div className="notable-events-list">
            {currentData.notableEvents.map((evt) => (
              <div key={evt.id} className="notable-event-item">
                <span className="notable-event-emoji" aria-hidden="true">{evt.emoji}</span>
                <div className="notable-event-content">
                  <span className="notable-event-title">{evt.title}</span>
                  <span className="notable-event-desc">{evt.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Footer Disclaimer & Roadmap Note */}
      <div className="reports-footer-disclaimer">
        <span>
          <strong>Parent Analytics Note:</strong> This report displays aggregate trends. Data shown is fictional demonstration telemetry modeled for parent supervision pair testing.
        </span>
        <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
          Multi-filter Demo Ready
        </span>
      </div>
    </section>
  );
}

export default OverallReports;
