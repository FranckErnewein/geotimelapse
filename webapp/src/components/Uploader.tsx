import { useState, useRef, FC, ChangeEvent } from 'react'
import { parse } from 'papaparse'
import { useForm, UseFormRegister, SubmitHandler } from 'react-hook-form'
import { values, keys, mapValues, omitBy, pickBy, compose } from 'lodash/fp'
import { CSVLine } from '../types'
import { sendCSV } from '../services'

interface FieldsMapping {
  id: string
  date: string
  value: string
  longitude: string
  latitude: string
}
type FieldName = 'id' | 'date' | 'value' | 'longitude' | 'latitude'

const SimpleSelect: FC<{
  name: FieldName
  options: string[]
  register: UseFormRegister<FieldsMapping>
}> = ({ name, options, register }) => {
  return (
    <p>
      <label>
        {name}:
        <select {...register(name)}>
          {options.map((o) => {
            return (
              <option key={o} value={o}>
                {o}
              </option>
            )
          })}
        </select>
      </label>
    </p>
  )
}

const Uploader: FC = () => {
  const fileInput = useRef<HTMLInputElement>(null)
  const [lines, setLines] = useState<CSVLine[]>([])
  const [fields, setFields] = useState<string[]>([])
  const [fieldTypes, setFieldTypes] = useState<Record<string, string>>({})
  const { register, handleSubmit } = useForm<FieldsMapping>()

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) {
      return
    }
    const csv = e.target.files[0]
    if (csv && csv.type === 'text/csv') {
      const items: CSVLine[] = []
      let n = 0
      parse<CSVLine>(csv, {
        dynamicTyping: true,
        header: true,
        step: (line, parser) => {
          items.push(line.data)
          if (line.meta.fields) setFields(line.meta.fields)
          const types = compose(
            omitBy((v) => v === 'object'),
            mapValues((x) => typeof x)
          )(line.data)
          setFieldTypes({ ...fieldTypes, ...types })
          n++
          if (n > 9) parser.abort()
        },
        complete: () => {
          setLines(items)
        },
      })
    }
  }

  const onSubmit: SubmitHandler<FieldsMapping> = (formData) => {
    if (fileInput.current && fileInput.current.files) {
      const csv = fileInput.current.files[0]
      const { id, date, value, longitude, latitude } = formData
      let csvContent = ''
      parse<CSVLine>(csv, {
        header: true,
        step: ({ data }) => {
          if (data[id])
            csvContent += `${data[id]},${data[date]},${data[value]},${data[longitude]},${data[latitude]}\n`
        },
        complete: () => {
          sendCSV('abc', csvContent)
        },
      })
    }
  }

  const pickByType = (type: string) =>
    compose(
      keys,
      pickBy((x) => x === type)
    )
  const strings = pickByType('string')(fieldTypes)
  const numbers = pickByType('number')(fieldTypes)

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <p>
          <input type="file" ref={fileInput} onChange={onFileChange} />
        </p>
        <SimpleSelect key="id" name="id" options={fields} register={register} />
        <SimpleSelect
          key="date"
          name="date"
          options={strings}
          register={register}
        />
        <SimpleSelect
          key="longitude"
          name="longitude"
          options={numbers}
          register={register}
        />
        <SimpleSelect
          key="latitude"
          name="latitude"
          options={numbers}
          register={register}
        />
        <SimpleSelect
          key="value"
          name="value"
          options={numbers}
          register={register}
        />
        <p>
          <input type="submit" />
        </p>
      </form>
      <table>
        <tbody>
          {lines.map((line, i) => {
            return (
              <tr key={i}>
                {values(line).map((value, j) => {
                  return <td key={j}>{value}</td>
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default Uploader
