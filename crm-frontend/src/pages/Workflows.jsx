import {
  Workflow as WorkflowIcon,
  Zap,
  Bot,
  UserCheck,
  Shield,
  Layers,
  Info,
} from 'lucide-react';
import { api } from '../api/index.js';
import { useAsync } from '../hooks/useAsync.js';
import { Badge, ErrorNotice, Loading, PageHeader, Panel } from '../components/ui.jsx';

const BUILD_TONE = { Live: 'ok', 'In Progress': 'brass', Paused: 'warn', Planned: 'neutral' };

export default function Workflows() {
  const workflows = useAsync(() => api.listWorkflows(), []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automated Workflows"
        lead="Architecture of the 12 core client lifecycle workflows, triggering events, and obligatory human gatekeepers."
      />

      <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-800 text-xs">
        <Info className="w-4 h-4 text-zinc-500 shrink-0" />
        <span>Workflow lifecycle status is managed in admin settings. System executions observe human gates unconditionally.</span>
      </div>

      {workflows.status === 'loading' && <Loading label="Loading workflow matrix" />}
      {workflows.status === 'error' && <ErrorNotice>{workflows.error.message}</ErrorNotice>}

      {workflows.status === 'ready' && (
        <Panel title="Core Automation Suite" description="Execution triggers, interaction modalities, and mandatory human authorization checkpoints.">
          <div className="rounded-xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
                    <th scope="col" className="py-3 px-4">Workflow Name</th>
                    <th scope="col" className="py-3 px-3">Trigger Event</th>
                    <th scope="col" className="py-3 px-3">Execution Mode</th>
                    <th scope="col" className="py-3 px-3">Human Gate</th>
                    <th scope="col" className="py-3 px-3">Phase</th>
                    <th scope="col" className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-xs">
                  {workflows.data.map((w) => (
                    <tr
                      key={w.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-zinc-400 w-5">#{w.id}</span>
                          <span>{w.name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">
                        <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                          {w.trigger}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <Bot className="w-3.5 h-3.5 text-zinc-400" />
                          {w.mode}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-zinc-700 dark:text-zinc-300 font-medium">
                        {w.gate === 'None' ? (
                          <span className="text-zinc-400">Autonomous</span>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                            <Shield className="w-3 h-3 text-amber-500" />
                            {w.gate}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-zinc-500 font-medium">
                        Phase {w.phase}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Badge tone={BUILD_TONE[w.buildStatus] || 'neutral'}>
                          {w.buildStatus || 'Planned'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
