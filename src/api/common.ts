import { type Session } from 'next-auth'
import axios from 'axios'
import { requireBuildEnv } from '@/src/utils/env'
import { type IdHolder, type NamedAPIResource, type NamedAPIResourceList } from '@/src/api/scheme'
import { wrapError } from '@/src/api/error'

// url of the API
const API_URL = requireBuildEnv('NEXT_PUBLIC_API_URL', process.env.NEXT_PUBLIC_API_URL)

// Class object of API resources has to implement this interface to be used in the API functions.
// __name__ is the name of the resource in the API. For example, if Patient's API endpoint is 'API_URL/patient',
// then __name__ should be 'patient'.
interface ApiResourceClass {
  __name__: string
}

// Class object of API resources has to implement this interface to support fetching from the API.
// Scheme is the data scheme according to the API.
// fromScheme is a static method that creates an instance of the resource from the scheme.
interface FetchableAPIResourceClass<Scheme> extends ApiResourceClass {
  new(...args: any[]): any

  fromScheme: (scheme: Scheme) => InstanceType<this>
}

// Base interface for pagination query parameters.
export interface PaginationParams {
  skip?: number
  limit?: number
}

// formatPaginationParams formats pagination query parameters. Endpoint query parameters has to be formatted as strings.
export const formatPaginationParams = (
  params: PaginationParams
): Record<string, string> => {
  const formattedParams: Record<string, string> = {}
  if (params.skip != null) {
    formattedParams.skip = params.skip.toString()
  }
  if (params.limit != null) {
    formattedParams.limit = params.limit.toString()
  }
  return formattedParams
}

// authHeader return the authorization headers for API requests.
// session is the session object from next-auth.
const authHeader = (
  session: Session
): { Authorization: string } => ({
  Authorization: `Bearer ${session.accessToken}`
})

// apiGET makes API GET requests. Wraps error handling and response data extraction.
// T is the response data type.
// url is the API endpoint.
// session is the session object from next-auth.
export const apiGET = async <T>(
  url: string,
  session: Session
): Promise<T> => {
  try {
    const response = await axios.get<T>(url, {
      headers: authHeader(session)
    })
    return response.data
  } catch (error) {
    throw wrapError(error)
  }
}

// apiPOST makes API POST requests. Wraps error handling and response data extraction.
// T is the response data type, V is the request data type.
// url is the API endpoint.
// session is the session object from next-auth.
// data is the request data.
export const apiPOST = async <T, V>(
  url: string,
  session: Session,
  data: V
): Promise<T> => {
  try {
    const response = await axios.post<T>(url, data, {
      headers: authHeader(session)
    })
    return response.data
  } catch (error) {
    throw wrapError(error)
  }
}

// apiDELETE makes API DELETE requests. Wraps error handling and response data extraction.
// T is the response data type.
// url is the API endpoint.
// session is the session object from next-auth.
export const apiDELETE = async <T>(
  url: string,
  session: Session
): Promise<T> => {
  try {
    const response = await axios.delete<T>(url, {
      headers: authHeader(session)
    })
    return response.data
  } catch (error) {
    throw wrapError(error)
  }
}

// getAPIResource fetches a single resource from the API.
// Scheme is the data scheme according to the API.
// resourceClass is the class object of the resource.
// id is the ID of the resource.
// session is the session object from next-auth.
// Returns the resource instance.
export const getAPIResource = async <Scheme>(
  resourceClass: FetchableAPIResourceClass<Scheme>,
  id: number,
  session: Session
): Promise<InstanceType<FetchableAPIResourceClass<Scheme>>> => {
  const url = `${API_URL}/${resourceClass.__name__}/${id}`
  return resourceClass.fromScheme(await apiGET<Scheme>(url, session))
}

// getAPIResourceList fetches a list of resources from the API.
// Scheme is the data scheme according to the API.
// resourceClass is the class object of the resource.
// params is the query parameters for the API endpoint.
// session is the session object from next-auth.
// Returns the list of resources and the total count of resources.
export const getAPIResourceList = async <Scheme>(
  resourceClass: FetchableAPIResourceClass<Scheme>,
  params: Record<string, string>,
  session: Session
): Promise<{
  items: Array<InstanceType<FetchableAPIResourceClass<Scheme>>>
  count: number
}> => {
  const urlParams = new URLSearchParams(params)
  const url = `${API_URL}/${resourceClass.__name__}?${urlParams.toString()}`

  const {
    results: resourceList,
    count
  } = await apiGET<NamedAPIResourceList>(url, session)

  return {
    items: await Promise.all(
      resourceList.map(async (resource: NamedAPIResource) =>
        resourceClass.fromScheme(await apiGET<Scheme>(resource.url, session))
      )
    ),
    count
  }
}

// createAPIResource creates a new resource in the API.
// Scheme is the data scheme according to the API.
// resourceClass is the class object of the resource.
// data is the new resource data.
// session is the session object from next-auth.
// Returns the ID of the new resource.
export const createAPIResource = async <Scheme>(
  resourceClass: ApiResourceClass,
  data: Scheme,
  session: Session
): Promise<number> => {
  const url = `${API_URL}/${resourceClass.__name__}`
  const response = await apiPOST<IdHolder, Scheme>(url, session, data)
  return response.id
}

// deleteAPIResource deletes a resource in the API.
// resourceClass is the class object of the resource.
// id is the ID of the resource.
// session is the session object from next-auth.
export const deleteAPIResource = async (
  resourceClass: ApiResourceClass,
  id: number,
  session: Session
): Promise<void> => {
  const url = `${API_URL}/${resourceClass.__name__}/${id}`
  await apiDELETE<unknown>(url, session)
}