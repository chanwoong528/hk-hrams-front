import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useDebounce } from "@uidotdev/usehooks";

import { GET_users } from "@/api/user/user";

import { Label } from "@/components/ui/label";
import { AutoComplete } from "@/components/ui/autocomplete";

export default function LeaderSelect({
  value,
  onChange,
}: {
  value: { name: string; id: string };
  onChange: (value: { name: string; id: string }) => void;
}) {
  const [searchValue, setSearchValue] = useState<string>(value.name);

  const debouncedSearchTerm = useDebounce(searchValue, 1000);

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users", debouncedSearchTerm],
    queryFn: () => GET_users(debouncedSearchTerm || ""),
    select: (data) => data.data,
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
      <AutoComplete
        isLoading={isLoadingUsers}
        selectedValue={value.id}
        onSelectedValueChange={(selectValue) => {
          const selectedUser = users?.find(
            (u: User) => u.userId === selectValue,
          );
          onChange?.({
            name: selectedUser?.koreanName || "",
            id: selectValue,
          });
          setSearchValue(selectedUser?.koreanName || "");
        }}
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
        items={items}
      />
    </>
  );
}
