import React, { useState } from 'react'
import { ActionIcon, Button, Group, MultiSelect, Select, Textarea, TextInput } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { type Patient } from '@/src/api/model/patient'
import { type EmergencyContact, type PersonalId } from '@/src/api/scheme'
import validator from 'validator'
import {
  israeliIDType,
  languageOptions,
  maxClosenessLength,
  maxIDLength,
  maxIDTypeLength,
  maxLanguages,
  minClosenessLength,
  minIDLength,
  minIDTypeLength,
  otherIDType
} from '@/src/app/patients/const'
import { toast } from 'react-toastify'
import { getToastOptions } from '@/src/utils/toast'
import { errorHandler } from '@/src/utils/error'
import { type EditModalProps } from '@/src/components/CustomTable'
import { israeliIDValidator, nameValidator, phoneValidator, specialNoteValidator } from '@/src/utils/validation'

type EditPatientFormProps = EditModalProps<Patient>

const EditPatientForm: React.FC<EditPatientFormProps> =
  ({
    session,
    computedColorScheme,
    onSuccess,
    item: initialPatient
  }) => {
    let initialType: string
    if (initialPatient !== null && initialPatient.personal_id.type !== 'ID' && initialPatient.personal_id.type !== 'Passport' && initialPatient.personal_id.type !== 'Drivers Licence') {
      initialType = 'Other'
    } else {
      if (initialPatient.personal_id.type === 'ID') {
        initialType = israeliIDType
      } else {
        initialType = initialPatient.personal_id.type
      }
    }

    const [showOtherIdType, setShowOtherIdType] = useState<boolean>(initialType === otherIDType)

    const form = useForm({
      mode: 'uncontrolled',
      validateInputOnBlur: true,
      initialValues: ({
        name: initialPatient.name,
        personal_id: {
          id: initialPatient.personal_id.id,
          type: initialType,
          other: initialType === otherIDType ? initialPatient.personal_id.type : ''
        },
        gender: initialPatient.gender,
        phone_number: initialPatient.phone_number ?? '',
        languages: initialPatient.languages,
        birth_date: initialPatient.birth_date,
        referred_by: initialPatient.referred_by ?? '',
        special_note: initialPatient.special_note ?? '',
        emergency_contacts: initialPatient.emergency_contacts
      }),
      validate: {
        name: (value: string) => nameValidator(value, true),
        personal_id: {
          id: (value, values) => {
            if (validator.isEmpty(value)) {
              return 'Personal ID number is required'
            }
            if (values.personal_id.type === israeliIDType) {
              return israeliIDValidator(value)
            } else if (!validator.isLength(value, {
              min: minIDLength,
              max: maxIDLength
            })) {
              return `Personal ID number must be between ${minIDLength} and ${maxIDLength} characters`
            }
            return null
          },
          other: (value, values) => {
            if (values.personal_id.type === otherIDType && !validator.isLength(value, {
              min: minIDTypeLength,
              max: maxIDTypeLength
            })) {
              return `ID type must be between ${minIDTypeLength} and ${maxIDTypeLength} characters`
            }
            return null
          }
        },
        phone_number: (value) => phoneValidator(value),
        birth_date: (value: Date | null) => {
          if (value == null) {
            return 'Birth date is required'
          }
          return null
        },
        emergency_contacts: {
          name: (value) => nameValidator(value, true),
          closeness: (value) => {
            if (!validator.isLength(value, {
              min: minClosenessLength,
              max: maxClosenessLength
            })) {
              return `Closeness must be between ${minClosenessLength} and ${maxClosenessLength} characters`
            }
            return null
          },
          phone: (value) => phoneValidator(value, true)
        },
        referred_by: (value: string | null) => nameValidator(value ?? ''),
        special_note: specialNoteValidator
      }
    })

    return (
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      <form onSubmit={form.onSubmit(async (values): Promise<void> => {
        const personalId: PersonalId = {
          id: values.personal_id.id,
          type: values.personal_id.type === otherIDType ? values.personal_id.other : values.personal_id.type
        }
        const birthDate = values.birth_date
        if (birthDate == null) {
          // unreachable state due to the validation
          throw new Error('Birth date is required')
        }
        const data = {
          ...values,
          personal_id: personalId,
          birth_date: birthDate
        }
        // change the fields of initialPatient to the new values
        initialPatient.name = data.name
        initialPatient.personal_id = data.personal_id
        initialPatient.birth_date = data.birth_date
        initialPatient.languages = data.languages
        initialPatient.emergency_contacts = data.emergency_contacts
        initialPatient.referred_by = data.referred_by
        initialPatient.special_note = data.special_note
        initialPatient.gender = data.gender
        initialPatient.phone_number = data.phone_number

        const result = await errorHandler(async () => {
          await toast.promise(initialPatient.update(session),
            {
              pending: `Updating patient ${data.name}...`,
              success: `Patient ${data.name} was updated successfully.`,
              error: 'Error while updating patient...'
            }, getToastOptions(computedColorScheme))
        }, computedColorScheme)
        if (result instanceof Error) {
          return
        }

        await onSuccess()
      })}>
        <TextInput
          withAsterisk
          label="Full Name"
          placeholder="Henry Smith"
          key={form.key('name')}
          {...form.getInputProps('name')}
        />

        <TextInput
          withAsterisk
          label="Personal ID"
          placeholder="3523651512"
          key={form.key('personal_id.id')}
          {...form.getInputProps('personal_id.id')}
        />

        <Select
          withAsterisk
          label="ID Type"
          data={[israeliIDType, 'Passport', 'Drivers Licence', otherIDType]}
          placeholder="Select ID type"
          key={form.key('personal_id.type')}
          {...form.getInputProps('personal_id.type')}
          onChange={(value) => {
            if (value === null) {
              return
            }
            form.setFieldValue('personal_id.type', value)
            setShowOtherIdType(value === otherIDType)
          }}
        />

        {showOtherIdType && (
          <TextInput
            withAsterisk
            placeholder="Specify other ID type"
            key={form.key('personal_id.other')}
            {...form.getInputProps('personal_id.other')}
          />
        )}

        <Select
          label="Gender"
          data={['unspecified', 'male', 'female']}
          placeholder="Select gender"
          key={form.key('gender')}
          {...form.getInputProps('gender')}
        />

        <TextInput
          label="Phone Number"
          placeholder="+972505201591"
          key={form.key('phone_number')}
          {...form.getInputProps('phone_number')}
        />

        <MultiSelect
          label="Languages"
          maxValues={maxLanguages}
          data={languageOptions}
          placeholder="Select languages"
          key={form.key('languages')}
          {...form.getInputProps('languages')}
        />

        <DateInput
          withAsterisk
          label="Birth Date"
          placeholder="2000-07-21"
          key={form.key('birth_date')}
          {...form.getInputProps('birth_date')}
        />

        {form.getValues().emergency_contacts.map((_, index) => (
          <Group key={`emergency_contacts.${index}`}>
            <TextInput
              withAsterisk
              label="Emergency Contact Name"
              placeholder="Alexa Smith"
              key={form.key(`emergency_contacts.${index}.name`)}
              {...form.getInputProps(`emergency_contacts.${index}.name`)}
            />
            <TextInput
              withAsterisk
              label="Closeness"
              placeholder="Mother"
              key={form.key(`emergency_contacts.${index}.closeness`)}
              {...form.getInputProps(`emergency_contacts.${index}.closeness`)}
            />
            <TextInput
              withAsterisk
              label="Phone"
              placeholder="+972603159352"
              key={form.key(`emergency_contacts.${index}.phone`)}
              {...form.getInputProps(`emergency_contacts.${index}.phone`)}
            />
            <ActionIcon color="red" onClick={() => {
              form.removeListItem('emergency_contacts', index)
            }}>
              <IconTrash size={16}/>
            </ActionIcon>
          </Group>
        ))}

        <Group mt="md">
          <Button variant="outline" onClick={() => {
            form.insertListItem('emergency_contacts', {
              name: '',
              closeness: '',
              phone: ''
            } satisfies EmergencyContact)
          }} size="xs" leftSection={<IconPlus size={14}/>}>
            Add Emergency Contact
          </Button>
        </Group>

        <TextInput
          label="Referred By"
          placeholder="John"
          {...form.getInputProps('referred_by')}
        />

        <Textarea
          label="Special Note"
          placeholder="Can't answer calls between 12:00 and 20:00"
          {...form.getInputProps('special_note')}
        />

        <Group mt="md">
          <Button type="submit">Update</Button>
        </Group>
      </form>
    )
  }

export default EditPatientForm
