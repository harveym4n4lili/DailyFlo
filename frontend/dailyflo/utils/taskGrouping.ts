/**
 * Task Grouping Utilities
 * 
 * This file contains helper functions for grouping and sorting tasks.
 * These utilities are extracted from ListCard to improve reusability and testability.
 */

import { Task } from '@/types';

/**
 * Formats a date as "24 Sep, Wednesday" for group headers
 * 
 * @param date - Date object to format
 * @returns Formatted date string
 */
export function formatDateForGroup(date: Date): string {
  const day = date.getDate(); // get day of month (1-31)
  const month = date.toLocaleDateString('en-US', { month: 'short' }); // get abbreviated month (Jan, Feb, etc.)
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }); // get full day name (Monday, Tuesday, etc.)
  return `${day} ${month}, ${dayOfWeek}`; // format as "24 Sep, Wednesday"
}

/**
 * Gets the group key for a task based on the grouping strategy
 * 
 * @param task - Task to get group key for
 * @param groupBy - Grouping strategy
 * @returns Group key string
 */
export function getTaskGroupKey(
  task: Task,
  groupBy: 'priority' | 'dueDate' | 'color' | 'none'
): string {
  switch (groupBy) {
    case 'priority':
      return `Priority ${task.priorityLevel}`;
    case 'dueDate':
      // don't separate completed tasks - they stay in their date groups
      // this allows completed tasks to remain visible in the today screen
      if (!task.dueDate) {
        return 'No Due Date';
      } else {
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // group tasks by their due date with smart date formatting
        if (dueDate.toDateString() === today.toDateString()) {
          return formatDateForGroup(today); // show today's date as "24 Sep, Wednesday"
        } else if (dueDate.toDateString() === tomorrow.toDateString()) {
          return 'Tomorrow';
        } else if (dueDate < today) {
          return 'Overdue';
        } else {
          return formatDateForGroup(dueDate); // show specific date as "24 Sep, Wednesday"
        }
      }
    case 'color':
      return task.color.charAt(0).toUpperCase() + task.color.slice(1);
    default:
      return 'All Tasks';
  }
}

/**
 * Groups tasks by the specified grouping strategy
 * 
 * @param tasks - Array of tasks to group
 * @param groupBy - Grouping strategy
 * @returns Record of group keys to task arrays
 */
export function groupTasks(
  tasks: Task[],
  groupBy: 'priority' | 'dueDate' | 'color' | 'none'
): Record<string, Task[]> {
  if (groupBy === 'none') {
    return { 'All Tasks': tasks };
  }

  const groups: Record<string, Task[]> = {};

  tasks.forEach(task => {
    const groupKey = getTaskGroupKey(task, groupBy);

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(task);
  });

  // sort tasks within "Today" group by time
  const today = new Date();
  const todayGroupKey = formatDateForGroup(today);
  if (groups[todayGroupKey]) {
    groups[todayGroupKey].sort((a, b) => {
      // if both have time, sort by time (ascending - earlier times first)
      if (a.time && b.time) {
        return a.time.localeCompare(b.time);
      }
      // tasks with time come before tasks without time
      if (a.time && !b.time) return -1;
      if (!a.time && b.time) return 1;
      // if neither has time, maintain original order
      return 0;
    });
  }

  return groups;
}

/**
 * Sorts tasks based on the specified sort criteria
 * 
 * @param tasks - Array of tasks to sort
 * @param sortBy - Sort field
 * @param sortDirection - Sort direction
 * @returns Sorted array of tasks
 */
export function sortTasks(
  tasks: Task[],
  sortBy: 'createdAt' | 'dueDate' | 'priority' | 'title',
  sortDirection: 'asc' | 'desc'
): Task[] {
  const sorted = [...tasks]; // create a copy to avoid mutating the original array

  sorted.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    // get the values to compare based on the sort field
    switch (sortBy) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'dueDate':
        aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        break;
      case 'priority':
        aValue = a.priorityLevel;
        bValue = b.priorityLevel;
        break;
      case 'createdAt':
      default:
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
    }

    // compare values based on sort direction
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  return sorted;
}

/**
 * Sorts group entries with special ordering:
 * - Today group goes first
 * - Overdue group goes after Today
 * - Other groups maintain original order
 * 
 * @param groupEntries - Array of [groupTitle, tasks] tuples
 * @returns Sorted array of group entries
 */
export function sortGroupEntries(
  groupEntries: [string, Task[]][]
): [string, Task[]][] {
  const today = new Date();
  const todayGroupKey = formatDateForGroup(today);

  return groupEntries.sort(([titleA], [titleB]) => {
    // Today group goes first (before Overdue)
    if (titleA === todayGroupKey) return -1;
    if (titleB === todayGroupKey) return 1;

    // Overdue group goes after Today
    if (titleA === 'Overdue') return 1;
    if (titleB === 'Overdue') return -1;

    // Otherwise maintain original order
    return 0;
  });
}

