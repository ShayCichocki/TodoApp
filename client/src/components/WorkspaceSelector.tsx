import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useWorkspaceContext } from '../contexts/WorkspaceContext';

export function WorkspaceSelector() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const { currentWorkspaceId, setCurrentWorkspaceId } = useWorkspaceContext();

  const currentWorkspace = workspaces?.find((w) => w.id === currentWorkspaceId);

  if (isLoading) {
    return (
      <div className="flex items-center text-sm text-gray-600">
        Loading workspaces...
      </div>
    );
  }

  if (!workspaces || workspaces.length === 0) {
    return null;
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          {currentWorkspace ? currentWorkspace.name : 'Select Workspace'}
          <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {workspaces.map((workspace) => (
              <Menu.Item key={workspace.id}>
                {({ active }) => (
                  <button
                    onClick={() => setCurrentWorkspaceId(workspace.id)}
                    className={`${
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                    } ${
                      currentWorkspaceId === workspace.id ? 'font-semibold' : ''
                    } group flex w-full items-center px-4 py-2 text-sm`}
                  >
                    <div className="flex-1">
                      <div>{workspace.name}</div>
                      {workspace._count && (
                        <div className="text-xs text-gray-500">
                          {workspace._count.todos} todos • {workspace._count.members} members
                        </div>
                      )}
                    </div>
                    {currentWorkspaceId === workspace.id && (
                      <svg
                        className="h-5 w-5 text-blue-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
