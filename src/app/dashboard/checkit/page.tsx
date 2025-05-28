'use client'

import dayjs from 'dayjs'
import React from 'react'
import { Patient } from '@/src/api/model/patient'
import { Badge, Flex, useComputedColorScheme, Stack } from '@mantine/core'
import CustomTable from '@/src/components/CustomTable'
import PhoneNumber from '@/src/components/PhoneNumber'
import {Task} from "@/src/api/model/task";


function getTaskColumns(computedColorScheme: string) {
  return [
      { title: '#', accessor: 'id' },
    { title: 'Title', accessor: 'title' },
    { title: 'Expertise', accessor: 'expertise' },
    { title: 'Patient', accessor: 'patient_id' }
  ]
}


function renderTodayTasks(label: string, keySuffix: string, computedColorScheme: string){
  return <CustomTable<Task>
      dataName={label}
      storeColumnKey={`dashboard-columns-${keySuffix}`}
      queryOptions={(session, page, pageSize) => ({
        queryKey: ['tasks', keySuffix, page, pageSize],
        queryFn: async (_ctx) => {
          return await Task.get(
              {
                skip: pageSize * (page - 1),
                limit: pageSize
              },
              session
          )
        }
      })}
      columns={getTaskColumns(computedColorScheme)}
  />
}

function DashboardPage (): React.JSX.Element {
  const computedColorScheme = useComputedColorScheme()

  return (
      <Stack gap="xl">
        {renderTodayTasks('Today\'s Tasks', 'a', computedColorScheme)}
      </Stack>
  )
}

export default DashboardPage
