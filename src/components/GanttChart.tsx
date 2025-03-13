import React, { useMemo } from 'react';
import { format, differenceInDays, addDays, startOfWeek, endOfWeek, parseISO, isValid } from 'date-fns';
import type { SalesAction, ActionPath } from '../types';
import { useAssigneeStore } from '../store/assignee';

interface GanttChartProps {
  actions: SalesAction[];
  actionPath: ActionPath | null;
}

export function GanttChart({ actions, actionPath }: GanttChartProps) {
  const assignees = useAssigneeStore(state => state.assignees);

  // Calculate date range for the chart
  const dateRange = useMemo(() => {
    if (!actions.length) return { start: new Date(), end: new Date(), days: 7 };

    const validDates = actions
      .map(a => parseISO(a.targetDate))
      .filter(isValid);

    if (!validDates.length) return { start: new Date(), end: new Date(), days: 7 };

    const minDate = startOfWeek(new Date(Math.min(...validDates.map(d => d.getTime()))));
    const maxDate = endOfWeek(new Date(Math.max(...validDates.map(d => d.getTime()))));

    return {
      start: minDate,
      end: maxDate,
      days: differenceInDays(maxDate, minDate) + 1
    };
  }, [actions]);

  // Group actions by assignee
  const actionsByAssignee = useMemo(() => {
    const grouped = new Map<string, SalesAction[]>();
    
    actions.forEach(action => {
      if (!action.assignedTo) return;
      const current = grouped.get(action.assignedTo) || [];
      grouped.set(action.assignedTo, [...current, action]);
    });

    return grouped;
  }, [actions]);

  const getDayPosition = (date: Date | string) => {
    try {
      const parsedDate = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(parsedDate)) return 0;
      
      const days = differenceInDays(parsedDate, dateRange.start);
      return (days / dateRange.days) * 100;
    } catch {
      return 0;
    }
  };

  // Generate week labels
  const weekLabels = useMemo(() => {
    const labels = [];
    let currentDate = dateRange.start;

    while (currentDate <= dateRange.end) {
      labels.push({
        date: currentDate,
        position: getDayPosition(currentDate)
      });
      currentDate = addDays(currentDate, 7);
    }

    return labels;
  }, [dateRange]);

  if (!actions.length) {
    return (
      <div className="p-8 text-center text-gray-500">
        No actions to display in the Gantt chart
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">
          {actionPath ? actionPath.name : 'Default Action Path'}
        </h2>
      </div>

      <div className="relative p-4">
        {/* Timeline header */}
        <div className="h-8 mb-4 relative">
          {weekLabels.map((label, index) => (
            <div
              key={index}
              className="absolute top-0 text-xs text-gray-500"
              style={{ left: `${label.position}%` }}
            >
              {format(label.date, 'MMM d')}
            </div>
          ))}
        </div>

        {/* Grid lines */}
        <div className="absolute inset-x-4 top-12 bottom-4">
          {weekLabels.map((label, index) => (
            <div
              key={index}
              className="absolute h-full border-l border-gray-200"
              style={{ left: `${label.position}%` }}
            />
          ))}
        </div>

        {/* Assignee rows */}
        <div className="space-y-4 relative">
          {Array.from(actionsByAssignee.entries()).map(([assigneeEmail, assigneeActions]) => {
            const assignee = assignees.find(a => a.email === assigneeEmail);
            
            return (
              <div key={assigneeEmail} className="relative">
                <div className="flex items-center gap-2 mb-2">
                  {assignee?.imageUrl ? (
                    <img
                      src={assignee.imageUrl}
                      alt={`${assignee.firstName} ${assignee.lastName}`}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: assignee?.color || '#f3f4f6',
                        color: assignee?.color ? '#fff' : '#6b7280'
                      }}
                    >
                      <span className="text-xs font-medium">
                        {assignee ? (
                          `${assignee.firstName[0]}${assignee.lastName[0]}`
                        ) : (
                          'U'
                        )}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    {assignee ? (
                      `${assignee.firstName} ${assignee.lastName}`
                    ) : (
                      assigneeEmail
                    )}
                  </span>
                </div>

                <div className="h-8 bg-gray-50 rounded relative">
                  {assigneeActions.map(action => {
                    const date = parseISO(action.targetDate);
                    if (!isValid(date)) return null;

                    const position = getDayPosition(date);
                    
                    return (
                      <div
                        key={action.id}
                        className="absolute top-1 h-6 px-2 rounded flex items-center text-white text-xs whitespace-nowrap overflow-hidden"
                        style={{
                          left: `${position}%`,
                          backgroundColor: action.category === 'TARGET' ? '#FF0000' :
                                         action.category === 'INFLUENCE' ? '#00B0F0' :
                                         action.category === 'SELECT' ? '#D1D1D1' :
                                         '#92D050',
                          transform: 'translateX(-50%)',
                          maxWidth: '200px'
                        }}
                        title={`${action.title} (${format(date, 'MMM d, yyyy')})`}
                      >
                        {action.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}