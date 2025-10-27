import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";

import { useDebounce } from "@uidotdev/usehooks";

import { GET_users } from "@/api/user/user";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

export default function LeaderSelect({
  value,
  onChange,
}: {
  value: { name: string; id: string };
  onChange: (value: { name: string; id: string }) => void;
}) {
  const [open, setOpen] = useState(false);

  const [searchValue, setSearchValue] = useState<string>(value.name);

  const debouncedSearchTerm = useDebounce(searchValue, 1000);

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users", debouncedSearchTerm],
    queryFn: () => GET_users(debouncedSearchTerm || ""),
    select: (data) => data.data.list,
    enabled: !!debouncedSearchTerm,
  });

  const items =
    users && users.length > 0
      ? users.map((u: User) => ({
          value: u.userId,
          label: u.koreanName,
        }))
      : [];

  return (
    <>
      <Label>리더</Label>
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild className='w-full'>
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open}
            className='w-full justify-between '>
            {value.name ? value.name : "Select user..."}
            <ChevronsUpDown className='opacity-50' />
          </Button>
        </PopoverTrigger>
        {isLoadingUsers ? (
          <div>Loading...</div>
        ) : (
          <PopoverContent className='p-0 w-[var(--radix-popover-trigger-width)]'>
            <Command shouldFilter={false}>
              <CommandInput
                placeholder='Search user...'
                className='h-9'
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                <CommandGroup>
                  {items?.map((user: { value: string; label: string }) => (
                    <CommandItem
                      key={user.value}
                      value={user.value}
                      onSelect={() => {
                        onChange?.({
                          name: user.label,
                          id: user.value,
                        });
                        setOpen(false);
                      }}>
                      {user.label}
                      <Check
                        className={cn(
                          "ml-auto",
                          value.id === user.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>
    </>
  );
}
