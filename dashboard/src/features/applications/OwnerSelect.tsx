/** A listbox, since a native option cannot show a staff photo. The popover must not let Escape close the drawer. */

import { Check, ChevronDown } from '@untitledui/icons';
import {
  Button as AriaButton,
  Label as AriaLabel,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  Popover as AriaPopover,
  Select as AriaSelect,
} from 'react-aria-components';

import { Avatar } from '@/components/base/avatar/avatar';
import { de } from '@/content/de';
import type { Owner } from '@/domain/application';
import { cx } from '@/utils/cx';
import { initialsOf } from '@/utils/initials';

import { CONTROL_CLASSNAME } from './controlStyles';

// A listbox row needs a key, unlike a native select's empty value.
const UNASSIGNED_KEY = 'unassigned';

const POPOVER_OFFSET = 4;

type OwnerSelectProps = {
  ownerId: string | null;
  owners: readonly Owner[];
  onChange: (ownerId: string | null) => void;
};

type OwnerOption = {
  key: string;
  name: string;
  isUnassigned: boolean;
};

function OwnerAvatar({ option }: { option: OwnerOption }) {
  return (
    <Avatar
      size="xs"
      alt=""
      initials={option.isUnassigned ? undefined : initialsOf(option.name)}
    />
  );
}

export function OwnerSelect({ ownerId, owners, onChange }: OwnerSelectProps) {
  const options: OwnerOption[] = [
    {
      key: UNASSIGNED_KEY,
      name: de.application.unassigned,
      isUnassigned: true,
    },
    ...owners.map((owner) => ({
      key: owner.id,
      name: owner.name,
      isUnassigned: false,
    })),
  ];

  // An unknown ownerId shows as itself, like the table.
  const selected =
    options.find((option) => option.key === (ownerId ?? UNASSIGNED_KEY)) ??
    ({
      key: ownerId ?? UNASSIGNED_KEY,
      name: ownerId ?? '',
      isUnassigned: false,
    } satisfies OwnerOption);

  return (
    <AriaSelect
      className="block"
      value={selected.key}
      onChange={(key) => {
        onChange(key === UNASSIGNED_KEY ? null : String(key));
      }}
    >
      <AriaLabel className="text-secondary mb-1.5 block cursor-pointer text-[13px] font-medium">
        {de.detail.owner}
      </AriaLabel>

      <AriaButton
        className={cx(
          CONTROL_CLASSNAME,
          'h-control flex cursor-pointer items-center gap-2 px-3 text-left font-medium',
        )}
      >
        <OwnerAvatar option={selected} />
        <span
          className={cx('truncate', selected.isUnassigned && 'text-tertiary')}
        >
          {selected.name}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="text-fg-quaternary ml-auto size-4 shrink-0"
        />
      </AriaButton>

      {/* Above the drawer's `z-30`, since the popover is portalled out of its stacking context. */}
      <AriaPopover
        offset={POPOVER_OFFSET}
        className="border-secondary bg-primary z-40 max-h-64 w-(--trigger-width) overflow-y-auto rounded-lg border p-1 shadow-lg outline-hidden"
      >
        <AriaListBox items={options} className="outline-hidden">
          {(option: OwnerOption) => (
            <AriaListBoxItem
              id={option.key}
              textValue={option.name}
              className={({ isFocused, isSelected }) =>
                cx(
                  'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden',
                  isFocused && 'bg-secondary',
                  isSelected ? 'text-primary font-medium' : 'text-secondary',
                )
              }
            >
              {({ isSelected }) => (
                <>
                  <OwnerAvatar option={option} />
                  <span className="truncate">{option.name}</span>
                  {isSelected ? (
                    <Check
                      aria-hidden="true"
                      className="text-fuut-purple ml-auto size-4 shrink-0"
                    />
                  ) : null}
                </>
              )}
            </AriaListBoxItem>
          )}
        </AriaListBox>
      </AriaPopover>
    </AriaSelect>
  );
}
