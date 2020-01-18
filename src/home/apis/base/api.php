<?php

/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/BaseTemplate/
 **/

/**
 * Base API for handling requests.
 */
class API
{
    private static $result = null;

    /**
     * Creates the result JSON.
     */
    public static function init()
    {
        self::$result = new stdClass();
    }

    /**
     * Echos the result JSON.
     */
    public static function echo()
    {
        echo json_encode(self::$result);
    }

    /**
     * Handles API calls by handing them over to the callback.
     * @param string $API The API to listen to
     * @param callable $callback The callback to be called with action and parameters
     * @param bool $filter Whether to filter XSS characters
     * @return mixed|null A result array with [success, result|error]
     */
    public static function handle($API, $callback, $filter = true)
    {
        if (isset($_POST["api"])) {
            $request = $_POST["api"];
            if ($filter) {
                $request = str_replace("<", "", $request);
                $request = str_replace(">", "", $request);
            }
            $APIs = json_decode($request);
            if (isset($APIs->$API)) {
                if (isset($APIs->$API->action) &&
                    isset($APIs->$API->parameters)) {
                    if (is_string($APIs->$API->action) &&
                        is_object($APIs->$API->parameters)) {
                        $action = $APIs->$API->action;
                        $action_parameters = $APIs->$API->parameters;
                        $action_result = $callback($action, $action_parameters);
                        if (is_array($action_result)) {
                            if (count($action_result) >= 2) {
                                if (is_bool($action_result[0])) {
                                    self::$result->$API = new stdClass();
                                    self::$result->$API->success = $action_result[0];
                                    self::$result->$API->result = $action_result[1];
                                    if (count($action_result) >= 3) {
                                        return $action_result[2];
                                    } else {
                                        return $action_result;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return null;
    }
}

/**
 * Base API for storing user data.
 */
class Database
{
    // Root directory
    private string $directory;
    // Subdirectories
    private string $directory_rows;
    private string $directory_columns;
    private string $directory_links;
    private string $access_file;
    // Const properties
    private const LENGTH_ID = 32;
    private const SEPARATOR = "\n";
    // Hashing properties
    private const HASHING_ALGORITHM = "sha256";
    private const HASHING_ROUNDS = 16;

    /**
     * Database constructor.
     * @param string $path Root directory
     */
    public function __construct($path = __DIR__)
    {
        $this->directory = $path . DIRECTORY_SEPARATOR . "database";
        $this->directory_rows = $this->directory . DIRECTORY_SEPARATOR . "rows";
        $this->directory_columns = $this->directory . DIRECTORY_SEPARATOR . "columns";
        $this->directory_links = $this->directory . DIRECTORY_SEPARATOR . "links";
        $this->access_file = $this->directory . DIRECTORY_SEPARATOR . ".htaccess";
        $this->create();
    }

    /**
     * Validates existence of database files and directories.
     */
    private function create()
    {
        // Check if database directories exists
        foreach ([$this->directory, $this->directory_columns, $this->directory_links, $this->directory_rows] as $directory) {
            if (!file_exists($directory)) {
                // Create the directory
                mkdir($directory);
            } else {
                // Make sure it is a directory
                if (!is_dir($directory)) {
                    // Remove the path
                    unlink($directory);
                    // Redo the whole thing
                    $this->create();
                    // Finish
                    return;
                }
            }
        }
        // Make sure the .htaccess exists
        if (!file_exists($this->access_file)) {
            // Write contents
            file_put_contents($this->access_file, "Deny from all");
        }
    }

    /**
     * Creates a new database row.
     * @param null $id ID
     * @return string Row ID
     */
    public function create_row($id = null)
    {
        // Generate a row ID
        if ($id === null)
            $id = self::id(32);
        // Check if the row already exists
        if (!$this->has_row($id)) {
            // Create row directory
            mkdir($this->directory_rows . DIRECTORY_SEPARATOR . $id);
        }
        return $id;
    }

    /**
     * Creates a new database column.
     * @param string $name Column name
     */
    public function create_column($name)
    {
        // Generate hashed string
        $hashed = self::hash($name);
        // Check if the column already exists
        if (!$this->has_column($name)) {
            // Create column directory
            mkdir($this->directory_columns . DIRECTORY_SEPARATOR . $hashed);
        }
    }

    /**
     * Creates a new database link.
     * @param string $row Row ID
     * @param string $link Link value
     */
    public function create_link($row, $link)
    {
        // Generate hashed string
        $hashed = self::hash($link);
        // Check if the link already exists
        if (!$this->has_link($link)) {
            // Make sure the row exists
            if ($this->has_row($row)) {
                // Generate link file
                file_put_contents($this->directory_links . DIRECTORY_SEPARATOR . $hashed, $row);
            }
        }
    }

    /**
     * Check whether a database row exists.
     * @param string $id Row ID
     * @return bool Exists
     */
    public function has_row($id)
    {
        // Store path
        $path = $this->directory_rows . DIRECTORY_SEPARATOR . $id;
        // Check if path exists and is a directory
        return file_exists($path) && is_dir($path);
    }

    /**
     * Check whether a database column exists.
     * @param string $name Column name
     * @return bool Exists
     */
    public function has_column($name)
    {
        // Generate hashed string
        $hashed = self::hash($name);
        // Store path
        $path = $this->directory_columns . DIRECTORY_SEPARATOR . $hashed;
        // Check if path exists and is a directory
        return file_exists($path) && is_dir($path);
    }

    /**
     * Check whether a database link exists.
     * @param string $link Link value
     * @return bool Exists
     */
    public function has_link($link)
    {
        // Generate hashed string
        $hashed = self::hash($link);
        // Store path
        $path = $this->directory_links . DIRECTORY_SEPARATOR . $hashed;
        // Check if path exists and is a file
        return file_exists($path) && is_file($path);
    }

    /**
     * Follows a link and retrieves the row ID it points to.
     * @param string $link Link value
     * @return string | null Row ID
     */
    public function follow_link($link)
    {
        // Check if link exists
        if ($this->has_link($link)) {
            // Generate hashed string
            $hashed = self::hash($link);
            // Store path
            $path = $this->directory_links . DIRECTORY_SEPARATOR . $hashed;
            // Read link
            return file_get_contents($path);
        }
        return null;
    }

    /**
     * Check whether a database value exists.
     * @param string $row Row ID
     * @param string $column Column name
     * @return bool Exists
     */
    public function isset($row, $column)
    {
        // Check if row exists
        if ($this->has_row($row)) {
            // Check if the column exists
            if ($this->has_column($column)) {
                // Generate hashed string
                $hashed = self::hash($column);
                // Store path
                $path = $this->directory_rows . DIRECTORY_SEPARATOR . $row . DIRECTORY_SEPARATOR . $hashed;
                // Check if path exists and is a file
                return file_exists($path) && is_file($path);
            }
        }
        return false;
    }

    /**
     * Sets a database value.
     * @param string $row Row ID
     * @param string $column Column name
     * @param string $value Value
     */
    public function set($row, $column, $value)
    {
        // Remove previous values
        if ($this->isset($row, $column)) {
            $this->unset($row, $column);
        }
        // Check if the column exists
        if ($this->has_column($column)) {
            // Create hashed string
            $hashed_name = self::hash($column);
            // Store path
            $value_path = $this->directory_rows . DIRECTORY_SEPARATOR . $row . DIRECTORY_SEPARATOR . $hashed_name;
            // Create hashed string
            $hashed_value = self::hash($value);
            // Write path
            file_put_contents($value_path, $value);
            // Store new path
            $index_path = $this->directory_columns . DIRECTORY_SEPARATOR . $hashed_name . DIRECTORY_SEPARATOR . $hashed_value;
            // Create rows array
            $rows = array();
            // Make sure the index file exists
            if (file_exists($index_path) && is_file($index_path)) {
                // Read contents
                $contents = file_get_contents($index_path);
                // Separate lines
                $rows = explode(self::SEPARATOR, $contents);
            }
            // Insert row to rows
            array_push($rows, $row);
            // Write contents
            file_put_contents($index_path, implode(self::SEPARATOR, $rows));
        }
    }

    /**
     * Unsets a database value.
     * @param string $row Row ID
     * @param string $column Column name
     */
    public function unset($row, $column)
    {
        // Check if a value is already set
        if ($this->isset($row, $column)) {
            // Check if the column exists
            if ($this->has_column($column)) {
                // Create hashed string
                $hashed_name = self::hash($column);
                // Store path
                $value_path = $this->directory_rows . DIRECTORY_SEPARATOR . $row . DIRECTORY_SEPARATOR . $hashed_name;
                // Get value & Hash it
                $value = file_get_contents($value_path);
                $hashed_value = self::hash($value);
                // Remove path
                unlink($value_path);
                // Store new path
                $index_path = $this->directory_columns . DIRECTORY_SEPARATOR . $hashed_name . DIRECTORY_SEPARATOR . $hashed_value;
                // Make sure the index file exists
                if (file_exists($index_path) && is_file($index_path)) {
                    // Read contents
                    $contents = file_get_contents($index_path);
                    // Separate lines
                    $rows = explode(self::SEPARATOR, $contents);
                    // Remove row from rows
                    unset($rows[array_search($row, $rows)]);
                    // Write contents
                    file_put_contents($index_path, implode(self::SEPARATOR, $rows));
                }
            }
        }
    }

    /**
     * Gets a database value.
     * @param string $row Row ID
     * @param string $column Column name
     * @return string | null Value
     */
    public function get($row, $column)
    {
        // Check if a value is set
        if ($this->isset($row, $column)) {
            // Generate hashed string
            $hashed = self::hash($column);
            // Store path
            $path = $this->directory_rows . DIRECTORY_SEPARATOR . $row . DIRECTORY_SEPARATOR . $hashed;
            // Read path
            return file_get_contents($path);
        }
        return null;
    }

    /**
     * Searches rows by column values.
     * @param string $column Column name
     * @param string $value Value
     * @return array Matching rows
     */
    public function search($column, $value)
    {
        // Create rows array
        $rows = array();
        // Check if the column exists
        if ($this->has_column($column)) {
            // Create hashed string
            $hashed_name = self::hash($column);
            // Create hashed string
            $hashed_value = self::hash($value);
            // Store new path
            $index_path = $this->directory_columns . DIRECTORY_SEPARATOR . $hashed_name . DIRECTORY_SEPARATOR . $hashed_value;
            // Make sure the index file exists
            if (file_exists($index_path) && is_file($index_path)) {
                // Read contents
                $contents = file_get_contents($index_path);
                // Separate lines
                $rows = explode(self::SEPARATOR, $contents);
            }
        }
        return $rows;
    }

    /**
     * Creates a random ID.
     * @param int $length ID length
     * @return string ID
     */
    private static function id($length = self::LENGTH_ID)
    {
        if ($length > 0) {
            return str_shuffle("0123456789abcdefghijklmnopqrstuvwxyz")[0] . self::id($length - 1);
        }
        return "";
    }

    /**
     * Creates a hash for a given message.
     * @param string $message Message
     * @param int $layers Layers
     * @return string Hash
     */
    private static function hash($message, $layers = self::HASHING_ROUNDS)
    {
        if ($layers === 0) {
            return hash(self::HASHING_ALGORITHM, $message);
        } else {
            return hash(self::HASHING_ALGORITHM, self::hash($message, $layers - 1));
        }
    }
}

/**
 * Base API for creating and verifying tokens.
 */
class Authority
{
    // Root directory
    private string $directory;
    // Subdirectories
    private string $secret_file;
    private string $access_file;
    // Lengths
    private const LENGTH_RANDOM = 32;
    private const LENGTH_SECRET = 512;
    // Token properties
    private const VALIDITY = 31 * 24 * 60 * 60;
    private const SEPARATOR = ":";
    // Hashing properties
    private const HASHING_ALGORITHM = "sha256";
    private const HASHING_ROUNDS = 1024;

    /**
     * Authority constructor.
     * @param string $path Root directory
     */
    public function __construct($path = __DIR__)
    {
        $this->directory = $path . DIRECTORY_SEPARATOR . "configuration";
        $this->secret_file = $this->directory . DIRECTORY_SEPARATOR . "secret";
        $this->access_file = $this->directory . DIRECTORY_SEPARATOR . ".htaccess";
        $this->create();
    }

    /**
     * Validates existence of configuration files and directories.
     */
    private function create()
    {
        // Make sure configuration directory exists
        if (!file_exists($this->directory)) {
            // Create the directory
            mkdir($this->directory);
        } else {
            // Make sure it is a directory
            if (!is_dir($this->directory)) {
                // Remove the path
                unlink($this->directory);
                // Redo the whole thing
                $this->create();
                // Finish
                return;
            }
        }
        // Make sure a shared secret exists
        if (!file_exists($this->secret_file)) {
            // Create the secret file
            file_put_contents($this->secret_file, self::random(self::LENGTH_SECRET));
        }
        // Make sure the .htaccess exists
        if (!file_exists($this->access_file)) {
            // Write contents
            file_put_contents($this->access_file, "Deny from all");
        }
    }

    /**
     * Returns the shared secret.
     * @return string Secret
     */
    private function secret()
    {
        // Read secret file
        return file_get_contents($this->secret_file);
    }

    /**
     * Creates a token.
     * @param string $issuer Issuer
     * @param string $contents Content
     * @param float | int $validity Validity time
     * @return string Token
     */
    public function issue($issuer, $contents, $validity = self::VALIDITY)
    {
        // Calculate expiry time
        $time = time() + intval($validity);
        $token_parts = [
            self::random(self::LENGTH_RANDOM),
            $issuer,
            $contents,
            strval($time)
        ];
        // Create token string
        $token = implode(self::SEPARATOR, $token_parts);
        // Calculate signature
        $signature = self::hash($token, $this->secret());
        // Return combined message
        return bin2hex(implode(self::SEPARATOR, [$token, $signature]));
    }

    /**
     * Validates a token.
     * @param string $issuer Issuer
     * @param string $token Token
     * @return array Validation result
     */
    public function validate($issuer, $token)
    {
        // Separate string
        $token_parts = explode(self::SEPARATOR, hex2bin($token));
        // Validate content count
        if (count($token_parts) === 5) {
            // Store parts
            $token_random = $token_parts[0];
            $token_issuer = $token_parts[1];
            $token_contents = $token_parts[2];
            $token_time = $token_parts[3];
            $token_signature = $token_parts[4];
            // Regenerate token string
            $token = implode(self::SEPARATOR, array_slice($token_parts, 0, 4));
            // Validate signature
            if (self::hash($token, $this->secret()) === $token_signature) {
                // Validate issuer
                if ($token_issuer === $issuer) {
                    // Check against time
                    $time = intval($token_time);
                    if ($time > time()) {
                        // Return token contents
                        return [true, $token_contents];
                    }
                    return [false, "Token expired"];
                }
                return [false, "Invalid token issuer"];
            }
            return [false, "Invalid token signature"];
        }
        return [false, "Invalid token format"];
    }

    /**
     * HMACs a message.
     * @param string $message Message
     * @param string $secret Shared secret
     * @param int $rounds Number of rounds
     * @return string HMACed
     */
    private static function hash($message, $secret, $rounds = self::HASHING_ROUNDS)
    {
        // Layer > 0 result
        if ($rounds > 0) {
            $layer = self::hash($message, $secret, $rounds - 1);
            $return = hash_hmac(self::HASHING_ALGORITHM, $layer, $secret);
        } else {
            // Layer 0 result
            $return = hash_hmac(self::HASHING_ALGORITHM, $message, $secret);
        }
        return $return;
    }

    /**
     * Creates a random string.
     * @param int $length String length
     * @return string String
     */
    private static function random($length = 0)
    {
        if ($length > 0) {
            return str_shuffle("0123456789abcdefghijklmnopqrstuvwxyz")[0] . self::random($length - 1);
        }
        return "";
    }
}