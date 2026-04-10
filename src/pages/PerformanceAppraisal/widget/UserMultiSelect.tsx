import { memo, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Label } from "@/components/ui/label";

import { MultiSelect } from "@/components/ui/multi-select";
import { GET_usersByPagination } from "@/api/user/user";
import type { HramsUserType } from "@/api/user/user";
// import { useState } from "react";
// import { useDebounce } from "@uidotdev/usehooks";
// import { Input } from "@/components/ui/input";

export default memo(
  function UserMultiSelect({
    value,
    onChange,
    users: propsUsers,
  }: {
    value: HramsUserType[];
    onChange: (value: HramsUserType[]) => void;
    users?: HramsUserType[];
  }) {
    const { data: fetchedUsers, isLoading: isLoadingUsers } = useQuery({
      queryKey: ["users", "all-for-multiselect"],
      // 제외 대상자 선택은 페이지네이션이 아닌 "전체 목록"이 필요함.
      // 현재 /user 기본 limit=10 이라서 넉넉히 큰 limit으로 1페이지에 가져온다.
      queryFn: () => GET_usersByPagination(1, 1000),
      select: (data) => data.data.list,
      enabled: !propsUsers, // Only fetch if no users provided
    });

    const users = propsUsers || fetchedUsers;

    const items = useMemo(() => {
      return users && users.length > 0
        ? users.map((u: HramsUserType) => ({
            value: u.userId,
            label: u.koreanName,
          }))
        : [];
    }, [users]);

    const selectedValues = useMemo(
      () => value?.map((v) => v.userId) ?? [],
      [value],
    );

    return (
      <>
        <Label>제외 대상자</Label>
        {isLoadingUsers ? (
          <div>Loading...</div>
        ) : (
          <>
            <MultiSelect
              value={selectedValues}
              options={items}
              placeholder={isLoadingUsers ? "Loading..." : "Select User"}
              searchable={true}
              modalPopover={true}
              onValueChange={(values) => {
                const nextUsers =
                  values
                    .map((v) => users?.find((u: HramsUserType) => u.userId === v))
                    .filter(Boolean) as HramsUserType[];
                onChange(nextUsers);
              }}

              // searchDisplay={
              //   <Input
              //     type='text'
              //     value={searchValue}
              //     onChange={(e) => setSearchValue(e.target.value)}
              //     placeholder='Search...'
              //   />
              // }
            />
          </>
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    // Deep comparison for User arrays
    if (prevProps.value.length !== nextProps.value.length) return false;
    const prevIds = new Set(prevProps.value.map((u) => u.userId).sort());
    const nextIds = new Set(nextProps.value.map((u) => u.userId).sort());
    return (
      prevIds.size === nextIds.size &&
      [...prevIds].every((id) => nextIds.has(id))
    );
  },
);
