import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { useWorkspaceMembers } from '../hooks/useWorkspaceMembers';

interface MemberPickerProps {
  workspaceId: number;
  selectedMemberId: number | null;
  onChange: (memberId: number | null) => void;
  className?: string;
}

export function MemberPicker({
  workspaceId,
  selectedMemberId,
  onChange,
  className = '',
}: MemberPickerProps) {
  const { data: members, isLoading } = useWorkspaceMembers(workspaceId);

  if (isLoading || !members) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        Loading members...
      </div>
    );
  }

  const selectedMember = members.find((m) => m.userId === selectedMemberId);

  // Add unassigned option
  const options = [
    { id: null, name: 'Unassigned', email: '' },
    ...members.map((m) => ({ id: m.userId, name: m.user.name ?? m.user.email, email: m.user.email })),
  ];

  const selected = selectedMember
    ? { id: selectedMember.userId, name: selectedMember.user.name ?? selectedMember.user.email, email: selectedMember.user.email }
    : options[0];

  return (
    <Listbox value={selected} onChange={(option) => onChange(option?.id ?? null)}>
      <div className={`relative ${className}`}>
        <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
          <span className="block truncate">{selected?.name}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </span>
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {options.map((option) => (
              <Listbox.Option
                key={option.id ?? 'unassigned'}
                className={({ active }) =>
                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                    active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'
                  }`
                }
                value={option}
              >
                {({ selected: isSelected }) => (
                  <>
                    <span
                      className={`block truncate ${
                        isSelected ? 'font-medium' : 'font-normal'
                      }`}
                    >
                      {option.name}
                      {option.email && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({option.email})
                        </span>
                      )}
                    </span>
                    {isSelected ? (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}
